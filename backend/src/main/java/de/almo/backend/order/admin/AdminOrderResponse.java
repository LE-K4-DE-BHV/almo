package de.almo.backend.order.admin;

import de.almo.backend.order.ContactPreference;
import de.almo.backend.order.Order;
import de.almo.backend.order.OrderItemResponse;
import de.almo.backend.order.OrderStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record AdminOrderResponse(
    long id,
    String orderNumber,
    String customerName,
    String customerEmail,
    OrderStatus status,
    ContactPreference contactPreference,
    String shippingName,
    String shippingAddress,
    String shippingCity,
    BigDecimal shippingCost,
    List<OrderItemResponse> items,
    BigDecimal itemsTotal,
    BigDecimal total,
    Instant createdAt) {

  public static AdminOrderResponse from(Order order, String customerName, String customerEmail) {
    return new AdminOrderResponse(
        order.getId(),
        order.orderNumber(),
        customerName,
        customerEmail,
        order.getStatus(),
        order.getContactPreference(),
        order.getShippingName(),
        order.getShippingAddress(),
        order.getShippingCity(),
        order.getShippingCost(),
        order.getItems().stream().map(OrderItemResponse::from).toList(),
        order.itemsTotal(),
        order.total(),
        order.getCreatedAt());
  }
}
