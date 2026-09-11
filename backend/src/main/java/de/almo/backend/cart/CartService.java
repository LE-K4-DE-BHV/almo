package de.almo.backend.cart;

import de.almo.backend.catalog.ProductSearchRepository;
import de.almo.backend.catalog.ProductSummary;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CartService {

  private final CartItemRepository cartItemRepository;
  private final ProductSearchRepository productSearchRepository;

  public CartService(
      CartItemRepository cartItemRepository, ProductSearchRepository productSearchRepository) {
    this.cartItemRepository = cartItemRepository;
    this.productSearchRepository = productSearchRepository;
  }

  public CartResponse getCart(CartOwner owner, String lang) {
    return toResponse(itemsFor(owner), lang);
  }

  @Transactional
  public CartResponse addItem(CartOwner owner, long productId, int quantity, String lang) {
    findExisting(owner, productId)
        .ifPresentOrElse(
            existing -> existing.setQuantity(existing.getQuantity() + quantity),
            () ->
                cartItemRepository.save(
                    new CartItem(owner.sessionId(), owner.userId(), productId, quantity)));
    return toResponse(itemsFor(owner), lang);
  }

  @Transactional
  public CartResponse updateQuantity(CartOwner owner, long itemId, int quantity, String lang) {
    CartItem item = ownedItem(owner, itemId);
    item.setQuantity(quantity);
    return toResponse(itemsFor(owner), lang);
  }

  @Transactional
  public CartResponse removeItem(CartOwner owner, long itemId, String lang) {
    CartItem item = ownedItem(owner, itemId);
    cartItemRepository.delete(item);
    return toResponse(itemsFor(owner), lang);
  }

  /**
   * Called right after a successful login/register (see AuthController), before the guest session's
   * cart becomes unreachable under its old identity. Merges by product: an item the user already
   * had (e.g. added on another device) gets its quantity increased rather than duplicated as a
   * second row.
   */
  @Transactional
  public void mergeGuestCartIntoUser(String guestSessionId, long userId) {
    if (guestSessionId == null) return;

    for (CartItem guestItem : cartItemRepository.findBySessionIdAndUserIdIsNull(guestSessionId)) {
      cartItemRepository
          .findByUserIdAndProductId(userId, guestItem.getProductId())
          .ifPresentOrElse(
              existing -> {
                existing.setQuantity(existing.getQuantity() + guestItem.getQuantity());
                cartItemRepository.delete(guestItem);
              },
              () -> {
                guestItem.setUserId(userId);
                guestItem.setSessionId(null);
              });
    }
  }

  private List<CartItem> itemsFor(CartOwner owner) {
    return owner.isGuest()
        ? cartItemRepository.findBySessionIdAndUserIdIsNull(owner.sessionId())
        : cartItemRepository.findByUserId(owner.userId());
  }

  private java.util.Optional<CartItem> findExisting(CartOwner owner, long productId) {
    return owner.isGuest()
        ? cartItemRepository.findBySessionIdAndUserIdIsNullAndProductId(
            owner.sessionId(), productId)
        : cartItemRepository.findByUserIdAndProductId(owner.userId(), productId);
  }

  /**
   * Loads the item and checks it actually belongs to {@code owner} - see CartItemNotFoundException.
   */
  private CartItem ownedItem(CartOwner owner, long itemId) {
    CartItem item = cartItemRepository.findById(itemId).orElseThrow(CartItemNotFoundException::new);
    boolean owned =
        owner.isGuest()
            ? owner.sessionId().equals(item.getSessionId())
            : owner.userId().equals(item.getUserId());
    if (!owned) throw new CartItemNotFoundException();
    return item;
  }

  private CartResponse toResponse(List<CartItem> items, String lang) {
    if (items.isEmpty()) return new CartResponse(List.of(), BigDecimal.ZERO, 0);

    Map<Long, ProductSummary> productsById =
        productSearchRepository
            .findSummariesByIds(items.stream().map(CartItem::getProductId).toList(), lang)
            .stream()
            .collect(Collectors.toMap(ProductSummary::id, Function.identity()));

    List<CartItemResponse> responses =
        items.stream()
            // A product referenced by a cart item could have been deleted since - skip it rather
            // than error the whole cart (Sprint 5 admin CRUD is when products first become
            // deletable; nothing produces this today, but the cart shouldn't break if it does).
            .filter(item -> productsById.containsKey(item.getProductId()))
            .map(
                item -> {
                  ProductSummary product = productsById.get(item.getProductId());
                  BigDecimal lineTotal =
                      product.price().multiply(BigDecimal.valueOf(item.getQuantity()));
                  return new CartItemResponse(
                      item.getId(),
                      item.getProductId(),
                      product.name(),
                      product.imageRefs().isEmpty() ? null : product.imageRefs().get(0),
                      product.price(),
                      item.getQuantity(),
                      lineTotal,
                      product.status());
                })
            .toList();

    BigDecimal subtotal =
        responses.stream()
            .map(CartItemResponse::lineTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    int totalQuantity = responses.stream().mapToInt(CartItemResponse::quantity).sum();
    return new CartResponse(responses, subtotal, totalQuantity);
  }
}
