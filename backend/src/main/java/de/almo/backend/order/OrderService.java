package de.almo.backend.order;

import de.almo.backend.cart.CartItem;
import de.almo.backend.cart.CartItemRepository;
import de.almo.backend.catalog.ProductSearchRepository;
import de.almo.backend.catalog.ProductStockRepository;
import de.almo.backend.catalog.ProductSummary;
import de.almo.backend.mail.MailService;
import de.almo.backend.user.User;
import de.almo.backend.user.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

  /** Spec-fixed values (docs/backlog.md Sprint 1 decision), not configurable per environment. */
  private static final BigDecimal FLAT_SHIPPING_COST = new BigDecimal("3.90");

  private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("30.00");

  private final OrderRepository orderRepository;
  private final CartItemRepository cartItemRepository;
  private final ProductSearchRepository productSearchRepository;
  private final ProductStockRepository productStockRepository;
  private final UserRepository userRepository;
  private final MailService mailService;
  private final ShopContactProperties contactProperties;

  public OrderService(
      OrderRepository orderRepository,
      CartItemRepository cartItemRepository,
      ProductSearchRepository productSearchRepository,
      ProductStockRepository productStockRepository,
      UserRepository userRepository,
      MailService mailService,
      ShopContactProperties contactProperties) {
    this.orderRepository = orderRepository;
    this.cartItemRepository = cartItemRepository;
    this.productSearchRepository = productSearchRepository;
    this.productStockRepository = productStockRepository;
    this.userRepository = userRepository;
    this.mailService = mailService;
    this.contactProperties = contactProperties;
  }

  @Transactional
  public Order checkout(long userId, CheckoutRequest request) {
    List<CartItem> cartItems = cartItemRepository.findByUserId(userId);
    if (cartItems.isEmpty()) {
      throw new EmptyCartException();
    }

    // "de" is fine here regardless of the buyer's UI language - price/name snapshots exist so
    // order history doesn't depend on catalog state later, not so it can be shown in three
    // languages. The order confirmation itself is always German (see OrderPdfService).
    Map<Long, ProductSummary> productsById =
        productSearchRepository
            .findSummariesByIds(cartItems.stream().map(CartItem::getProductId).toList(), "de")
            .stream()
            .collect(Collectors.toMap(ProductSummary::id, Function.identity()));

    BigDecimal itemsTotal = BigDecimal.ZERO;
    for (CartItem cartItem : cartItems) {
      ProductSummary product = productsById.get(cartItem.getProductId());
      if (product == null) {
        // Product vanished from the catalog between "add to cart" and checkout - Sprint 5 makes
        // deletion possible; nothing produces this today, but checkout must not silently order
        // a product that no longer exists.
        throw new InsufficientStockException("product #" + cartItem.getProductId());
      }
      itemsTotal =
          itemsTotal.add(product.price().multiply(BigDecimal.valueOf(cartItem.getQuantity())));
    }

    BigDecimal shippingCost =
        itemsTotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0 ? BigDecimal.ZERO : FLAT_SHIPPING_COST;

    Order order =
        new Order(
            userId,
            request.contactPreference(),
            shippingCost,
            request.name(),
            request.address(),
            request.city());

    for (CartItem cartItem : cartItems) {
      ProductSummary product = productsById.get(cartItem.getProductId());
      if (!productStockRepository.decrementStock(cartItem.getProductId(), cartItem.getQuantity())) {
        // Throwing inside a @Transactional method rolls back every decrement already applied in
        // this loop too - an order is never left half-decremented.
        throw new InsufficientStockException(product.name());
      }
      order.addItem(
          new OrderItem(product.id(), product.name(), cartItem.getQuantity(), product.price()));
    }

    orderRepository.save(order);
    cartItemRepository.deleteAll(cartItems);
    notifyAdmin(order);
    return order;
  }

  public List<OrderSummaryResponse> listForUser(long userId) {
    return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
        .map(OrderSummaryResponse::from)
        .toList();
  }

  public Order findOwned(long orderId, long userId) {
    return orderRepository
        .findByIdAndUserId(orderId, userId)
        .orElseThrow(OrderNotFoundException::new);
  }

  private void notifyAdmin(Order order) {
    User customer =
        userRepository.findById(order.getUserId()).orElseThrow(IllegalStateException::new);
    String itemLines =
        order.getItems().stream()
            .map(
                item ->
                    "- %dx %s (%.2f EUR)"
                        .formatted(
                            item.getQuantity(), item.getProductName(), item.getPriceAtOrder()))
            .collect(Collectors.joining("<br>"));

    mailService.send(
        contactProperties.getContactEmail(),
        "Neue Bestellung " + order.orderNumber(),
        """
        <p>Neue Bestellung %s von %s (%s).</p>
        <p>%s</p>
        <p>Versand: %.2f EUR, Gesamt: %.2f EUR</p>
        <p>Adresse: %s, %s</p>
        <p>Kontaktwunsch: %s</p>
        """
            .formatted(
                order.orderNumber(),
                customer.getName(),
                customer.getEmail(),
                itemLines,
                order.getShippingCost(),
                order.total(),
                order.getShippingAddress(),
                order.getShippingCity(),
                order.getContactPreference()));
  }
}
