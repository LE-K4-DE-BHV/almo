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
import org.springframework.web.bind.annotation.RestController;

/** Under /api/admin/**, so SecurityConfig's admin filter chain already requires ROLE_ADMIN here. */
@RestController
@RequestMapping("/api/admin/categories")
public class AdminCategoryController {

  private final AdminCategoryService categoryService;

  public AdminCategoryController(AdminCategoryService categoryService) {
    this.categoryService = categoryService;
  }

  @GetMapping
  public List<AdminCategoryResponse> list() {
    return categoryService.list().stream().map(AdminCategoryResponse::from).toList();
  }

  @GetMapping("/{id}")
  public AdminCategoryResponse get(@PathVariable long id) {
    return AdminCategoryResponse.from(categoryService.get(id));
  }

  @PostMapping
  public AdminCategoryResponse create(@Valid @RequestBody AdminCategoryRequest request) {
    return AdminCategoryResponse.from(categoryService.create(request));
  }

  @PutMapping("/{id}")
  public AdminCategoryResponse update(
      @PathVariable long id, @Valid @RequestBody AdminCategoryRequest request) {
    return AdminCategoryResponse.from(categoryService.update(id, request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable long id) {
    categoryService.delete(id);
    return ResponseEntity.noContent().build();
  }
}
