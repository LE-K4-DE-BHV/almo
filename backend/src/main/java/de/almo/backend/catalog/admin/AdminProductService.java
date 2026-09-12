package de.almo.backend.catalog.admin;

import de.almo.backend.catalog.Product;
import de.almo.backend.catalog.ProductJpaRepository;
import de.almo.backend.catalog.ProductNotFoundException;
import de.almo.backend.catalog.ProductTranslation;
import de.almo.backend.image.ImageUploadService;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AdminProductService {

  private final ProductJpaRepository productRepository;
  private final ImageUploadService imageUploadService;

  public AdminProductService(
      ProductJpaRepository productRepository, ImageUploadService imageUploadService) {
    this.productRepository = productRepository;
    this.imageUploadService = imageUploadService;
  }

  public List<Product> list() {
    return productRepository.findAllWithTranslations();
  }

  public Product get(long id) {
    return productRepository
        .findByIdWithTranslations(id)
        .orElseThrow(() -> new ProductNotFoundException(id));
  }

  @Transactional
  public Product create(AdminProductRequest request) {
    Product product =
        new Product(
            request.categoryId(),
            request.price(),
            request.compareAtPrice(),
            request.stockQuantity(),
            request.metalColor(),
            request.badge());
    applyTranslations(product, request.translations());
    return productRepository.save(product);
  }

  @Transactional
  public Product update(long id, AdminProductRequest request) {
    Product product = get(id);
    product.setCategoryId(request.categoryId());
    product.setPrice(request.price());
    product.setCompareAtPrice(request.compareAtPrice());
    product.setStockQuantity(request.stockQuantity());
    product.setMetalColor(request.metalColor());
    product.setBadge(request.badge());
    applyTranslations(product, request.translations());
    return product;
  }

  @Transactional
  public void delete(long id) {
    Product product = get(id);
    try {
      productRepository.delete(product);
      productRepository.flush();
    } catch (DataIntegrityViolationException e) {
      throw new ProductHasOrdersException();
    }
  }

  @Transactional
  public Product addImage(long id, MultipartFile file) {
    Product product = get(id);
    String url = imageUploadService.upload(id, file);
    product.getImageRefs().add(url);
    return product;
  }

  @Transactional
  public Product removeImage(long id, String url) {
    Product product = get(id);
    product.getImageRefs().remove(url);
    return product;
  }

  /**
   * Updates matching-language translations in place and only adds/removes what actually changed,
   * rather than clearing the collection and re-adding everything. A naive clear()-then-re-add hit
   * the product_translations_product_id_lang_key unique constraint in practice: with orphanRemoval,
   * Hibernate can flush the new rows' INSERTs before the cleared rows' DELETEs, momentarily
   * violating the (product_id, lang) uniqueness the two operations would otherwise never conflict
   * on.
   */
  private void applyTranslations(Product product, Map<String, ProductTranslationDto> translations) {
    Map<String, ProductTranslation> existing =
        product.getTranslations().stream()
            .collect(Collectors.toMap(ProductTranslation::getLang, Function.identity()));

    product.getTranslations().removeIf(t -> !translations.containsKey(t.getLang()));

    translations.forEach(
        (lang, dto) -> {
          ProductTranslation translation = existing.get(lang);
          if (translation != null) {
            translation.setName(dto.name());
            translation.setDescription(dto.description());
            translation.setDetails(dto.details());
          } else {
            product.addTranslation(
                new ProductTranslation(lang, dto.name(), dto.description(), dto.details()));
          }
        });
  }
}
