package de.almo.backend.cart;

import java.math.BigDecimal;

public record CartItemResponse(
    long id,
    long productId,
    String name,
    String imageRef,
    BigDecimal price,
    int quantity,
    BigDecimal lineTotal,
    String status) {}
