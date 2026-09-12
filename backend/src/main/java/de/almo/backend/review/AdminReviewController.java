package de.almo.backend.review;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Under /api/admin/**, so SecurityConfig's admin filter chain already requires ROLE_ADMIN here. */
@RestController
@RequestMapping("/api/admin/reviews")
public class AdminReviewController {

  private final ReviewRepository reviewRepository;

  public AdminReviewController(ReviewRepository reviewRepository) {
    this.reviewRepository = reviewRepository;
  }

  @GetMapping
  public List<AdminReviewResponse> list() {
    return reviewRepository.findAllForAdmin();
  }

  @PatchMapping("/{id}")
  public void update(@PathVariable long id, @Valid @RequestBody UpdateReviewRequest request) {
    if (!reviewRepository.updateModeration(id, request.status(), request.rating())) {
      throw new ReviewNotFoundException();
    }
  }
}
