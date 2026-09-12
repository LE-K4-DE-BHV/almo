package de.almo.backend.review;

import de.almo.backend.user.User;
import de.almo.backend.user.UserRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Mounted under /api/products so GET is covered by SecurityConfig's existing "GET /api/products/**"
 * permitAll rule - no separate security rule needed for that path. POST falls through to the
 * customer chain's default "anyRequest().authenticated()" instead, same as the wishlist - reviewing
 * requires an account.
 */
@RestController
@RequestMapping("/api/products/{productId}/reviews")
public class ReviewController {

  private final ReviewRepository reviewRepository;
  private final UserRepository userRepository;

  public ReviewController(ReviewRepository reviewRepository, UserRepository userRepository) {
    this.reviewRepository = reviewRepository;
    this.userRepository = userRepository;
  }

  @GetMapping
  public List<ReviewResponse> list(@PathVariable long productId) {
    return reviewRepository.findPublishedByProductId(productId);
  }

  @PostMapping
  public ResponseEntity<ReviewResponse> submit(
      @PathVariable long productId,
      @Valid @RequestBody SubmitReviewRequest body,
      Authentication authentication) {
    User user = currentUser(authentication);
    if (!reviewRepository.hasPurchased(user.getId(), productId)) {
      throw new NotPurchasedException();
    }
    if (reviewRepository.hasReviewed(user.getId(), productId)) {
      throw new AlreadyReviewedException();
    }
    ReviewResponse response =
        reviewRepository.insert(
            productId, user.getId(), user.getName(), body.rating(), body.comment());
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  private User currentUser(Authentication authentication) {
    return userRepository
        .findByEmail(authentication.getName())
        .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));
  }
}
