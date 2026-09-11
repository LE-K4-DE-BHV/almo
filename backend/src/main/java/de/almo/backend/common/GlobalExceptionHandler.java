package de.almo.backend.common;

import de.almo.backend.auth.EmailAlreadyRegisteredException;
import de.almo.backend.auth.InvalidResetTokenException;
import de.almo.backend.cart.CartItemNotFoundException;
import de.almo.backend.catalog.ProductNotFoundException;
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
