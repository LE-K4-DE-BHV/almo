package de.almo.backend.catalog;

import java.math.BigDecimal;
import java.util.List;

/** The full product page needs description/details that the listing (ProductSummary) doesn't. */
public record ProductDetailResponse(
    long id,
    String categoryKey,
    String categoryName,
    String name,
    String description,
    List<String> details,
    String metalColor,
    String badge,
    String status,
    BigDecimal price,
    BigDecimal compareAtPrice,
    List<String> imageRefs,
    Double avgRating,
    long reviewCount) {}
