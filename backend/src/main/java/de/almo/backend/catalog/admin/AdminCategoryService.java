package de.almo.backend.catalog.admin;

import de.almo.backend.catalog.Category;
import de.almo.backend.catalog.CategoryJpaRepository;
import de.almo.backend.catalog.CategoryTranslation;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminCategoryService {

  private final CategoryJpaRepository categoryRepository;

  public AdminCategoryService(CategoryJpaRepository categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  public List<Category> list() {
    return categoryRepository.findAllWithTranslations();
  }

  public Category get(long id) {
    return categoryRepository
        .findByIdWithTranslations(id)
        .orElseThrow(CategoryNotFoundException::new);
  }

  @Transactional
  public Category create(AdminCategoryRequest request) {
    if (categoryRepository.existsByKey(request.key())) {
      throw new CategoryKeyTakenException(request.key());
    }
    Category category = new Category(request.key());
    applyTranslations(category, request.translations());
    return categoryRepository.save(category);
  }

  @Transactional
  public Category update(long id, AdminCategoryRequest request) {
    Category category = get(id);
    if (!category.getKey().equals(request.key()) && categoryRepository.existsByKey(request.key())) {
      throw new CategoryKeyTakenException(request.key());
    }
    category.setKey(request.key());
    applyTranslations(category, request.translations());
    return category;
  }

  @Transactional
  public void delete(long id) {
    Category category = get(id);
    try {
      categoryRepository.delete(category);
      categoryRepository.flush();
    } catch (DataIntegrityViolationException e) {
      throw new CategoryInUseException();
    }
  }

  /**
   * Updates matching-language translations in place instead of clear()-then-re-add - see the
   * identical comment on AdminProductService.applyTranslations for why: a naive clear violates the
   * (category_id, lang) unique constraint when Hibernate flushes the new INSERTs before the
   * orphaned rows' DELETEs.
   */
  private void applyTranslations(Category category, Map<String, String> translations) {
    Map<String, CategoryTranslation> existing =
        category.getTranslations().stream()
            .collect(Collectors.toMap(CategoryTranslation::getLang, Function.identity()));

    category.getTranslations().removeIf(t -> !translations.containsKey(t.getLang()));

    translations.forEach(
        (lang, name) -> {
          CategoryTranslation translation = existing.get(lang);
          if (translation != null) {
            translation.setName(name);
          } else {
            category.addTranslation(new CategoryTranslation(lang, name));
          }
        });
  }
}
