package de.almo.backend.catalog.admin;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.util.Map;

/** translations: lang ("de"/"en"/"fr") -> that language's copy. */
public record AdminProductRequest(
    @NotNull Long categoryId,
    @NotNull @PositiveOrZero BigDecimal price,
    BigDecimal compareAtPrice,
    @NotNull @PositiveOrZero Integer stockQuantity,
    String metalColor,
    String badge,
    @NotEmpty Map<String, ProductTranslationDto> translations) {}
