package de.almo.backend.common;

import de.almo.backend.auth.AccountHasOrdersException;
import de.almo.backend.auth.EmailAlreadyRegisteredException;
import de.almo.backend.auth.InvalidResetTokenException;
import de.almo.backend.cart.CartItemNotFoundException;
import de.almo.backend.catalog.ProductNotFoundException;
import de.almo.backend.catalog.admin.CategoryInUseException;
import de.almo.backend.catalog.admin.CategoryKeyTakenException;
import de.almo.backend.catalog.admin.CategoryNotFoundException;
import de.almo.backend.catalog.admin.ProductHasOrdersException;
import de.almo.backend.image.ImageUploadNotConfiguredException;
import de.almo.backend.order.EmptyCartException;
import de.almo.backend.order.InsufficientStockException;
import de.almo.backend.order.OrderNotFoundException;
import de.almo.backend.review.AlreadyReviewedException;
import de.almo.backend.review.NotPurchasedException;
import de.almo.backend.review.ReviewNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Turns exceptions into the same {@link ApiError} JSON shape everywhere, instead of each controller
 * building its own error response or letting Spring's default (HTML-ish) error page leak through to
 * what's meant to be a JSON API.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(EmailAlreadyRegisteredException.class)
  public ResponseEntity<ApiError> handleEmailTaken(EmailAlreadyRegisteredException e) {
    return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(e.getMessage()));
  }

  @ExceptionHandler(InvalidResetTokenException.class)
  public ResponseEntity<ApiError> handleInvalidResetToken(InvalidResetTokenException e) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(e.getMessage()));
  }

  @ExceptionHandler(ProductNotFoundException.class)
  public ResponseEntity<ApiError> handleProductNotFound(ProductNotFoundException e) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(e.getMessage()));
  }

  @ExceptionHandler(CartItemNotFoundException.class)
  public ResponseEntity<ApiError> handleCartItemNotFound(CartItemNotFoundException e) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(e.getMessage()));
  }

  @ExceptionHandler(OrderNotFoundException.class)
  public ResponseEntity<ApiError> handleOrderNotFound(OrderNotFoundException e) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(e.getMessage()));
  }

  @ExceptionHandler(EmptyCartException.class)
  public ResponseEntity<ApiError> handleEmptyCart(EmptyCartException e) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(e.getMessage()));
  }

  @ExceptionHandler(InsufficientStockException.class)
  public ResponseEntity<ApiError> handleInsufficientStock(InsufficientStockException e) {
    return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(e.getMessage()));
  }

  @ExceptionHandler(AccountHasOrdersException.class)
  public ResponseEntity<ApiError> handleAccountHasOrders(AccountHasOrdersException e) {
    return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(e.getMessage()));
  }

  @ExceptionHandler(CategoryNotFoundException.class)
  public ResponseEntity<ApiError> handleCategoryNotFound(CategoryNotFoundException e) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(e.getMessage()));
  }

  @ExceptionHandler(CategoryKeyTakenException.class)
  public ResponseEntity<ApiError> handleCategoryKeyTaken(CategoryKeyTakenException e) {
    return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(e.getMessage()));
  }

  @ExceptionHandler(CategoryInUseException.class)
  public ResponseEntity<ApiError> handleCategoryInUse(CategoryInUseException e) {
    return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(e.getMessage()));
  }

  @ExceptionHandler(ProductHasOrdersException.class)
  public ResponseEntity<ApiError> handleProductHasOrders(ProductHasOrdersException e) {
    return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(e.getMessage()));
  }

  @ExceptionHandler(ImageUploadNotConfiguredException.class)
  public ResponseEntity<ApiError> handleImageUploadNotConfigured(
      ImageUploadNotConfiguredException e) {
    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(new ApiError(e.getMessage()));
  }

  @ExceptionHandler(ReviewNotFoundException.class)
  public ResponseEntity<ApiError> handleReviewNotFound(ReviewNotFoundException e) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(e.getMessage()));
  }

  @ExceptionHandler(NotPurchasedException.class)
  public ResponseEntity<ApiError> handleNotPurchased(NotPurchasedException e) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiError(e.getMessage()));
  }

  @ExceptionHandler(AlreadyReviewedException.class)
  public ResponseEntity<ApiError> handleAlreadyReviewed(AlreadyReviewedException e) {
    return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(e.getMessage()));
  }

  @ExceptionHandler(BadCredentialsException.class)
  public ResponseEntity<ApiError> handleBadCredentials() {
    // Deliberately vague - "wrong email" vs "wrong password" would tell an attacker which emails
    // are registered.
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(new ApiError("Invalid email or password"));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException e) {
    String message =
        e.getBindingResult().getFieldErrors().stream()
            .findFirst()
            .map(err -> err.getField() + ": " + err.getDefaultMessage())
            .orElse("Validation failed");
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(message));
  }
}
