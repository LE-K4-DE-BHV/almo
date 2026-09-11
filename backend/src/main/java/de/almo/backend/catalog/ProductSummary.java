package de.almo.backend.catalog;

import java.math.BigDecimal;
import java.util.List;

/**
 * The shape a product listing (shop page, search results) actually needs - already localized to the
 * requested lang, rating pre-averaged from reviews (0/null until Sprint 3 seeds any). Not the full
 * product detail (no full description text needed for a grid card) - that's Sprint 3's product
 * page.
 */
public record ProductSummary(
    long id,
    String categoryKey,
    String categoryName,
    String name,
    String metalColor,
    String badge,
    String status,
    BigDecimal price,
    BigDecimal compareAtPrice,
    List<String> imageRefs,
    Double avgRating,
    long reviewCount) {}
