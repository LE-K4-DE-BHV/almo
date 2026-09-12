package de.almo.backend.catalog.admin;

import de.almo.backend.catalog.Category;
import de.almo.backend.catalog.CategoryTranslation;
import java.util.Map;
import java.util.stream.Collectors;

public record AdminCategoryResponse(long id, String key, Map<String, String> translations) {

  public static AdminCategoryResponse from(Category category) {
    return new AdminCategoryResponse(
        category.getId(),
        category.getKey(),
        category.getTranslations().stream()
            .collect(Collectors.toMap(CategoryTranslation::getLang, CategoryTranslation::getName)));
  }
}
