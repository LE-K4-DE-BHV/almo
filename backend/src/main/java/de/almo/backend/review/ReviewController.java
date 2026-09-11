package de.almo.backend.review;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Mounted under /api/products so it's covered by SecurityConfig's existing "GET /api/products/**"
 * permitAll rule - no separate security rule needed for this path.
 */
@RestController
@RequestMapping("/api/products/{productId}/reviews")
public class ReviewController {

  private final ReviewRepository reviewRepository;

  public ReviewController(ReviewRepository reviewRepository) {
    this.reviewRepository = reviewRepository;
  }

  @GetMapping
  public List<ReviewResponse> list(@PathVariable long productId) {
    return reviewRepository.findPublishedByProductId(productId);
  }
}
