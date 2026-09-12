package de.almo.backend.order.admin;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Under /api/admin/**, so SecurityConfig's admin filter chain already requires ROLE_ADMIN here. */
@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

  private final AdminOrderService orderService;

  public AdminOrderController(AdminOrderService orderService) {
    this.orderService = orderService;
  }

  @GetMapping
  public List<AdminOrderResponse> list() {
    return orderService.list();
  }

  @PatchMapping("/{id}")
  public AdminOrderResponse updateStatus(
      @PathVariable long id, @Valid @RequestBody UpdateOrderStatusRequest request) {
    return orderService.updateStatus(id, request);
  }
}
