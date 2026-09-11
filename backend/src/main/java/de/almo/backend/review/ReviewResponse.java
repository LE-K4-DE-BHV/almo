package de.almo.backend.review;

import java.time.Instant;

public record ReviewResponse(
    long id, String userName, int rating, String comment, Instant createdAt) {}
