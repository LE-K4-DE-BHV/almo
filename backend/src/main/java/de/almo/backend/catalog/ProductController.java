package de.almo.backend.catalog;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
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
      @RequestParam(required = false) String sort) {
    return productSearchRepository.search(
        new ProductSearchCriteria(
            lang, category, minPrice, maxPrice, metalColor, availability, search, sort));
  }
}
