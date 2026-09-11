package de.almo.backend.catalog;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
public class ProductController {

  private final ProductSearchRepository productSearchRepository;

  public ProductController(ProductSearchRepository productSearchRepository) {
    this.productSearchRepository = productSearchRepository;
  }

  @GetMapping
  public List<ProductSummary> list(
      @RequestParam(defaultValue = "de") String lang,
      @RequestParam(required = false) String category,
      @RequestParam(required = false) BigDecimal minPrice,
      @RequestParam(required = false) BigDecimal maxPrice,
      @RequestParam(required = false) String metalColor,
      @RequestParam(required = false) String availability,
      @RequestParam(required = false) String search,
      @RequestParam(required = false) String sort,
      // Bypasses every filter above - "give me exactly these products, in no particular order".
      // Used by the frontend's recently-viewed feature (a client-side id list from localStorage,
      // see frontend/src/recentlyViewed.ts) to render product cards for ids it already has.
      @RequestParam(required = false) String ids) {
    if (ids != null && !ids.isBlank()) {
      List<Long> idList = Arrays.stream(ids.split(",")).map(Long::parseLong).toList();
      return productSearchRepository.findSummariesByIds(idList, lang);
    }
    return productSearchRepository.search(
        new ProductSearchCriteria(
            lang, category, minPrice, maxPrice, metalColor, availability, search, sort));
  }

  @GetMapping("/{id}")
  public ProductDetailResponse detail(
      @PathVariable long id, @RequestParam(defaultValue = "de") String lang) {
    return productSearchRepository
        .findDetailById(id, lang)
        .orElseThrow(() -> new ProductNotFoundException(id));
  }
}
