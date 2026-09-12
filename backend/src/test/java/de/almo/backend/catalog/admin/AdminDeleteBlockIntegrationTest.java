package de.almo.backend.catalog.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.almo.backend.cart.CartItem;
import de.almo.backend.cart.CartItemRepository;
import de.almo.backend.catalog.Category;
import de.almo.backend.catalog.Product;
import de.almo.backend.order.CheckoutRequest;
import de.almo.backend.order.ContactPreference;
import de.almo.backend.order.OrderService;
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
 * Covers the FK-as-business-rule pattern from Sprint 5 (see docs/backlog.md): deleting a
 * product/category that's still referenced fails with a clear domain exception instead of either
 * cascading silently or leaking a raw DataIntegrityViolationException. Previously only checked
 * manually via curl (see Sprint 5 test notes) - this is the first automated coverage.
 */
class AdminDeleteBlockIntegrationTest extends AbstractIntegrationTest {

  @Autowired private AdminCategoryService adminCategoryService;
  @Autowired private AdminProductService adminProductService;
  @Autowired private OrderService orderService;
  @Autowired private UserRepository userRepository;
  @Autowired private CartItemRepository cartItemRepository;

  private Category createTestCategory() {
    return adminCategoryService.create(
        new AdminCategoryRequest("cat-" + UUID.randomUUID(), Map.of("de", "Testkategorie")));
  }

  private Product createTestProduct(long categoryId) {
    ProductTranslationDto translation =
        new ProductTranslationDto("Testprodukt", "Beschreibung", List.of());
    return adminProductService.create(
        new AdminProductRequest(
            categoryId, new BigDecimal("10.00"), null, 5, null, null, Map.of("de", translation)));
  }

  @Test
  void deletingACategoryStillUsedByAProductFails() {
    Category category = createTestCategory();
    createTestProduct(category.getId());

    assertThatThrownBy(() -> adminCategoryService.delete(category.getId()))
        .isInstanceOf(CategoryInUseException.class);

    // Still there - the failed delete must not have half-applied anything.
    assertThat(adminCategoryService.get(category.getId())).isNotNull();
  }

  @Test
  void deletingAnUnusedCategorySucceeds() {
    Category category = createTestCategory();

    adminCategoryService.delete(category.getId());

    assertThatThrownBy(() -> adminCategoryService.get(category.getId()))
        .isInstanceOf(CategoryNotFoundException.class);
  }

  @Test
  void deletingAProductStillReferencedByAnOrderFails() {
    Category category = createTestCategory();
    Product product = createTestProduct(category.getId());
    String suffix = UUID.randomUUID().toString();
    User user =
        userRepository.save(
            new User(
                "order-block-" + suffix + "@example.com",
                "irrelevant-hash",
                "Test User",
                Role.CUSTOMER));
    cartItemRepository.save(new CartItem(null, user.getId(), product.getId(), 1));
    orderService.checkout(
        user.getId(),
        new CheckoutRequest("Test User", "Teststr. 1", "Berlin", ContactPreference.EMAIL));

    assertThatThrownBy(() -> adminProductService.delete(product.getId()))
        .isInstanceOf(ProductHasOrdersException.class);

    assertThat(adminProductService.get(product.getId())).isNotNull();
  }

  @Test
  void deletingAProductWithNoOrdersSucceeds() {
    Category category = createTestCategory();
    Product product = createTestProduct(category.getId());

    adminProductService.delete(product.getId());

    assertThatThrownBy(() -> adminProductService.get(product.getId()))
        .isInstanceOf(de.almo.backend.catalog.ProductNotFoundException.class);
  }
}
