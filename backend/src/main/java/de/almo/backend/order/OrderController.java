package de.almo.backend.order;

import de.almo.backend.user.UserRepository;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

  private final OrderService orderService;
  private final OrderPdfService orderPdfService;
  private final UserRepository userRepository;

  public OrderController(
      OrderService orderService, OrderPdfService orderPdfService, UserRepository userRepository) {
    this.orderService = orderService;
    this.orderPdfService = orderPdfService;
    this.userRepository = userRepository;
  }

  @GetMapping
  public List<OrderSummaryResponse> list(Authentication authentication) {
    return orderService.listForUser(currentUserId(authentication));
  }

  @GetMapping("/{id}")
  public OrderDetailResponse detail(@PathVariable long id, Authentication authentication) {
    return OrderDetailResponse.from(orderService.findOwned(id, currentUserId(authentication)));
  }

  @GetMapping("/{id}/pdf")
  public ResponseEntity<byte[]> pdf(@PathVariable long id, Authentication authentication) {
    Order order = orderService.findOwned(id, currentUserId(authentication));
    byte[] pdf = orderPdfService.render(order);
    return ResponseEntity.ok()
        .contentType(MediaType.APPLICATION_PDF)
        .header(
            HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"" + order.orderNumber() + ".pdf\"")
        .body(pdf);
  }

  private long currentUserId(Authentication authentication) {
    return userRepository
        .findByEmail(authentication.getName())
        .orElseThrow(() -> new IllegalStateException("Authenticated user not found"))
        .getId();
  }
}
