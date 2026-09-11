package de.almo.backend.cart;

import de.almo.backend.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * permitAll (see SecurityConfig) - a cart has to work for guests, not just logged-in customers.
 * Every mutating call resolves a {@link CartOwner} first and every lookup in CartService checks
 * ownership, so a guest can never touch another guest's or user's cart items.
 */
@RestController
@RequestMapping("/api/cart")
public class CartController {

  private final CartService cartService;
  private final UserRepository userRepository;

  public CartController(CartService cartService, UserRepository userRepository) {
    this.cartService = cartService;
    this.userRepository = userRepository;
  }

  @GetMapping
  public CartResponse getCart(
      @RequestParam(defaultValue = "de") String lang,
      HttpServletRequest request,
      Authentication authentication) {
    return cartService.getCart(resolveOwner(request, authentication), lang);
  }

  @PostMapping("/items")
  public CartResponse addItem(
      @Valid @RequestBody AddCartItemRequest body,
      @RequestParam(defaultValue = "de") String lang,
      HttpServletRequest request,
      Authentication authentication) {
    return cartService.addItem(
        resolveOwner(request, authentication), body.productId(), body.quantity(), lang);
  }

  @PatchMapping("/items/{itemId}")
  public CartResponse updateItem(
      @PathVariable long itemId,
      @Valid @RequestBody UpdateCartItemRequest body,
      @RequestParam(defaultValue = "de") String lang,
      HttpServletRequest request,
      Authentication authentication) {
    return cartService.updateQuantity(
        resolveOwner(request, authentication), itemId, body.quantity(), lang);
  }

  @DeleteMapping("/items/{itemId}")
  public CartResponse removeItem(
      @PathVariable long itemId,
      @RequestParam(defaultValue = "de") String lang,
      HttpServletRequest request,
      Authentication authentication) {
    return cartService.removeItem(resolveOwner(request, authentication), itemId, lang);
  }

  /**
   * A guest gets a session created here on their very first cart touch if one doesn't exist yet
   * (nothing forces a session before that point - CSRF tokens live in a cookie, not the session).
   */
  private CartOwner resolveOwner(HttpServletRequest request, Authentication authentication) {
    if (authentication != null && !(authentication instanceof AnonymousAuthenticationToken)) {
      Long userId =
          userRepository
              .findByEmail(authentication.getName())
              .orElseThrow(() -> new IllegalStateException("Authenticated user not found"))
              .getId();
      return new CartOwner(null, userId);
    }
    return new CartOwner(request.getSession(true).getId(), null);
  }
}
