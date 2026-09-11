package de.almo.backend.order;

import java.math.BigDecimal;

public record OrderItemResponse(
    long productId,
    String productName,
    int quantity,
    BigDecimal priceAtOrder,
    BigDecimal lineTotal) {

  static OrderItemResponse from(OrderItem item) {
    return new OrderItemResponse(
        item.getProductId(),
        item.getProductName(),
        item.getQuantity(),
        item.getPriceAtOrder(),
        item.getPriceAtOrder().multiply(BigDecimal.valueOf(item.getQuantity())));
  }
}
