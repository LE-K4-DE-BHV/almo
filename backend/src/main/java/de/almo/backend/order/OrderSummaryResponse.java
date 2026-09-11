package de.almo.backend.order;

import java.math.BigDecimal;
import java.time.Instant;

public record OrderSummaryResponse(
    long id, String orderNumber, OrderStatus status, Instant createdAt, BigDecimal total) {

  static OrderSummaryResponse from(Order order) {
    return new OrderSummaryResponse(
        order.getId(), order.orderNumber(), order.getStatus(), order.getCreatedAt(), order.total());
  }
}
