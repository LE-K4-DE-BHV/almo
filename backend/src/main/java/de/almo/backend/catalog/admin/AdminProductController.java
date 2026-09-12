package de.almo.backend.catalog.admin;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** Under /api/admin/**, so SecurityConfig's admin filter chain already requires ROLE_ADMIN here. */
@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {

  private final AdminProductService productService;

  public AdminProductController(AdminProductService productService) {
    this.productService = productService;
  }

  @GetMapping
  public List<AdminProductResponse> list() {
    return productService.list().stream().map(AdminProductResponse::from).toList();
  }

  @GetMapping("/{id}")
  public AdminProductResponse get(@PathVariable long id) {
    return AdminProductResponse.from(productService.get(id));
  }

  @PostMapping
  public AdminProductResponse create(@Valid @RequestBody AdminProductRequest request) {
    return AdminProductResponse.from(productService.create(request));
  }

  @PutMapping("/{id}")
  public AdminProductResponse update(
      @PathVariable long id, @Valid @RequestBody AdminProductRequest request) {
    return AdminProductResponse.from(productService.update(id, request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable long id) {
    productService.delete(id);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{id}/images")
  public AdminProductResponse addImage(@PathVariable long id, @RequestParam MultipartFile file) {
    return AdminProductResponse.from(productService.addImage(id, file));
  }

  @DeleteMapping("/{id}/images")
  public AdminProductResponse removeImage(@PathVariable long id, @RequestParam String url) {
    return AdminProductResponse.from(productService.removeImage(id, url));
  }
}
