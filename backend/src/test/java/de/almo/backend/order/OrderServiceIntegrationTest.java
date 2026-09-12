package de.almo.backend.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.almo.backend.cart.CartItem;
import de.almo.backend.cart.CartItemRepository;
import de.almo.backend.catalog.admin.AdminCategoryRequest;
import de.almo.backend.catalog.admin.AdminCategoryService;
import de.almo.backend.catalog.admin.AdminProductRequest;
import de.almo.backend.catalog.admin.AdminProductService;
import de.almo.backend.catalog.admin.ProductTranslationDto;
import de.almo.backend.support.AbstractIntegrationTest;
import de.almo.backend.user.Role;
import de.almo.backend.user.User;
import de.almo.backend.user.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Covers the checkout flow's actual money/inventory logic end to end against a real Postgres
 * container - see Sprint 6 decision in docs/backlog.md. Every fixture (user/category/product) is
 * created fresh per test with a random suffix rather than relying on the dev seed data (V4
 * migration) or an empty schema, since the container is shared across the whole test run (see
 * AbstractIntegrationTest).
 */
class OrderServiceIntegrationTest extends AbstractIntegrationTest {

  @Autowired private OrderService orderService;
  @Autowired private UserRepository userRepository;
  @Autowired private CartItemRepository cartItemRepository;
  @Autowired private AdminCategoryService adminCategoryService;
  @Autowired private AdminProductService adminProductService;

  private long createTestUser() {
    String suffix = UUID.randomUUID().toString();
    User user =
        new User(
            "checkout-test-" + suffix + "@example.com",
            "irrelevant-hash",
            "Test User",
            Role.CUSTOMER);
    return userRepository.save(user).getId();
  }

  private long createTestProduct(BigDecimal price, int stockQuantity) {
    String suffix = UUID.randomUUID().toString();
    long categoryId =
        adminCategoryService
            .create(new AdminCategoryRequest("cat-" + suffix, Map.of("de", "Testkategorie")))
            .getId();
    ProductTranslationDto translation =
        new ProductTranslationDto("Testprodukt", "Beschreibung", List.of());
    return adminProductService
        .create(
            new AdminProductRequest(
                categoryId, price, null, stockQuantity, null, null, Map.of("de", translation)))
        .getId();
  }

  @Test
  void checkoutDecrementsStockByOrderedQuantity() {
    long userId = createTestUser();
    long productId = createTestProduct(new BigDecimal("10.00"), 5);
    cartItemRepository.save(new CartItem(null, userId, productId, 3));

    Order order =
        orderService.checkout(
            userId,
            new CheckoutRequest("Test User", "Teststr. 1", "Berlin", ContactPreference.EMAIL));

    assertThat(order.getItems()).hasSize(1);
    assertThat(order.itemsTotal()).isEqualByComparingTo("30.00");
    assertThat(adminProductService.get(productId).getStockQuantity()).isEqualTo(2);
    // Cart is cleared as part of the same checkout transaction, not a separate step the caller
    // has to remember - see OrderService.checkout.
    assertThat(cartItemRepository.findByUserId(userId)).isEmpty();
  }

  @Test
  void checkoutBelowFreeShippingThresholdChargesFlatShipping() {
    long userId = createTestUser();
    long productId = createTestProduct(new BigDecimal("10.00"), 5);
    cartItemRepository.save(new CartItem(null, userId, productId, 1));

    Order order =
        orderService.checkout(
            userId,
            new CheckoutRequest("Test User", "Teststr. 1", "Berlin", ContactPreference.EMAIL));

    assertThat(order.getShippingCost()).isEqualByComparingTo("3.90");
  }

  @Test
  void checkoutAtOrAboveFreeShippingThresholdWaivesShipping() {
    long userId = createTestUser();
    long productId = createTestProduct(new BigDecimal("30.00"), 5);
    cartItemRepository.save(new CartItem(null, userId, productId, 1));

    Order order =
        orderService.checkout(
            userId,
            new CheckoutRequest("Test User", "Teststr. 1", "Berlin", ContactPreference.EMAIL));

    assertThat(order.getShippingCost()).isEqualByComparingTo("0.00");
  }

  @Test
  void checkoutWithInsufficientStockRollsBackTheWholeOrderAndLeavesStockUntouched() {
    long userId = createTestUser();
    // First item has enough stock and would decrement successfully on its own; the second
    // doesn't - the whole checkout must roll back, including the first item's decrement, not
    // leave a half-decremented order behind (see OrderService.checkout's @Transactional comment).
    long inStockProductId = createTestProduct(new BigDecimal("10.00"), 5);
    long outOfStockProductId = createTestProduct(new BigDecimal("10.00"), 1);
    cartItemRepository.save(new CartItem(null, userId, inStockProductId, 2));
    cartItemRepository.save(new CartItem(null, userId, outOfStockProductId, 5));

    assertThatThrownBy(
            () ->
                orderService.checkout(
                    userId,
                    new CheckoutRequest(
                        "Test User", "Teststr. 1", "Berlin", ContactPreference.EMAIL)))
        .isInstanceOf(InsufficientStockException.class);

    assertThat(adminProductService.get(inStockProductId).getStockQuantity()).isEqualTo(5);
    assertThat(adminProductService.get(outOfStockProductId).getStockQuantity()).isEqualTo(1);
    // Cart survives too - nothing succeeded, so nothing should have been cleared.
    assertThat(cartItemRepository.findByUserId(userId)).hasSize(2);
  }

  @Test
  void checkoutWithEmptyCartThrows() {
    long userId = createTestUser();

    assertThatThrownBy(
            () ->
                orderService.checkout(
                    userId,
                    new CheckoutRequest(
                        "Test User", "Teststr. 1", "Berlin", ContactPreference.EMAIL)))
        .isInstanceOf(EmptyCartException.class);
  }
}
