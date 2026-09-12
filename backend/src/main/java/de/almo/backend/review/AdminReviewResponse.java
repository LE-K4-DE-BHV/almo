package de.almo.backend.review;

import java.time.Instant;

public record AdminReviewResponse(
    long id,
    long productId,
    String productName,
    String userName,
    int rating,
    String comment,
    String status,
    Instant createdAt) {}
