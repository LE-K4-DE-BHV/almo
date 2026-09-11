package de.almo.backend.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderDetailResponse(
    long id,
    String orderNumber,
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

  static OrderDetailResponse from(Order order) {
    return new OrderDetailResponse(
        order.getId(),
        order.orderNumber(),
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
