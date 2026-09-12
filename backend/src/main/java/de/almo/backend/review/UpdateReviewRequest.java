package de.almo.backend.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Admin moderation only (see Sprint 5 decision in docs/backlog.md): visibility and the star rating
 * are adjustable, the review text itself is not - that's a user's own words, not the admin's to
 * rewrite.
 */
public record UpdateReviewRequest(
    @NotNull ReviewStatus status, @NotNull @Min(1) @Max(5) Integer rating) {}
