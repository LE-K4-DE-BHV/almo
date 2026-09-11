package de.almo.backend.order;

import de.almo.backend.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * No permitAll rule for this path (see SecurityConfig) - falls under the customer chain's default
 * "anyRequest().authenticated()". Matches the old almofrontenddesign/checkout.html, which called
 * requireLogin() before showing the checkout form - a guest was always sent to /login first.
 */
@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

  private final OrderService orderService;
  private final UserRepository userRepository;

  public CheckoutController(OrderService orderService, UserRepository userRepository) {
    this.orderService = orderService;
    this.userRepository = userRepository;
  }

  @PostMapping
  public OrderDetailResponse checkout(
      @Valid @RequestBody CheckoutRequest request, Authentication authentication) {
    long userId =
        userRepository
            .findByEmail(authentication.getName())
            .orElseThrow(() -> new IllegalStateException("Authenticated user not found"))
            .getId();
    return OrderDetailResponse.from(orderService.checkout(userId, request));
  }
}
