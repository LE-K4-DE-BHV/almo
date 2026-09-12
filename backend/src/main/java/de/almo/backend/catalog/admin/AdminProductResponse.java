package de.almo.backend.catalog.admin;

import de.almo.backend.catalog.Product;
import de.almo.backend.catalog.ProductTranslation;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public record AdminProductResponse(
    long id,
    long categoryId,
    BigDecimal price,
    BigDecimal compareAtPrice,
    int stockQuantity,
    String status,
    String metalColor,
    String badge,
    List<String> imageRefs,
    Map<String, ProductTranslationDto> translations) {

  public static AdminProductResponse from(Product product) {
    return new AdminProductResponse(
        product.getId(),
        product.getCategoryId(),
        product.getPrice(),
        product.getCompareAtPrice(),
        product.getStockQuantity(),
        product.getStatus(),
        product.getMetalColor(),
        product.getBadge(),
        product.getImageRefs(),
        product.getTranslations().stream()
            .collect(
                Collectors.toMap(
                    ProductTranslation::getLang,
                    t ->
                        new ProductTranslationDto(
                            t.getName(), t.getDescription(), t.getDetails()))));
  }
}
