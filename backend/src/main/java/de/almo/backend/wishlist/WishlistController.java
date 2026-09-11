package de.almo.backend.wishlist;

import de.almo.backend.catalog.ProductSearchRepository;
import de.almo.backend.catalog.ProductSummary;
import de.almo.backend.user.UserRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * No permitAll rule for this path (see SecurityConfig) - falls under the customer chain's default
 * "anyRequest().authenticated()", unlike the cart, which explicitly works for guests too. The data
 * model backs this: wishlist_items has no session_id column, only user_id (see V1__init.sql) - a
 * guest wishlist was never on the table.
 */
@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

  private final WishlistRepository wishlistRepository;
  private final ProductSearchRepository productSearchRepository;
  private final UserRepository userRepository;

  public WishlistController(
      WishlistRepository wishlistRepository,
      ProductSearchRepository productSearchRepository,
      UserRepository userRepository) {
    this.wishlistRepository = wishlistRepository;
    this.productSearchRepository = productSearchRepository;
    this.userRepository = userRepository;
  }

  @GetMapping
  public List<ProductSummary> list(
      @RequestParam(defaultValue = "de") String lang, Authentication authentication) {
    long userId = currentUserId(authentication);
    return productSearchRepository.findSummariesByIds(
        wishlistRepository.findProductIds(userId), lang);
  }

  @PostMapping("/items")
  public ResponseEntity<Void> add(
      @Valid @RequestBody AddWishlistItemRequest body, Authentication authentication) {
    wishlistRepository.add(currentUserId(authentication), body.productId());
    return ResponseEntity.noContent().build();
  }

  @DeleteMapping("/items/{productId}")
  public ResponseEntity<Void> remove(@PathVariable long productId, Authentication authentication) {
    wishlistRepository.remove(currentUserId(authentication), productId);
    return ResponseEntity.noContent().build();
  }

  private long currentUserId(Authentication authentication) {
    return userRepository
        .findByEmail(authentication.getName())
        .orElseThrow(() -> new IllegalStateException("Authenticated user not found"))
        .getId();
  }
}
