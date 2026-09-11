package de.almo.backend.catalog;

import java.math.BigDecimal;

/** All fields except {@code lang} are optional filters - null means "don't filter on this". */
public record ProductSearchCriteria(
    String lang,
    String categoryKey,
    BigDecimal minPrice,
    BigDecimal maxPrice,
    String metalColor,
    String availability, // in_stock / low_stock / out_of_stock, matches products.status
    String search,
    String sort // price-asc / price-desc / name / rating, anything else falls back to newest-first
    ) {}
