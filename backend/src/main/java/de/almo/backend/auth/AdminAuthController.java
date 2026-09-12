package de.almo.backend.auth;

import de.almo.backend.auth.dto.LoginRequest;
import de.almo.backend.auth.dto.UserResponse;
import de.almo.backend.common.ApiError;
import de.almo.backend.user.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Deliberately separate from AuthController/AuthService's public surface, not just a role check
 * bolted onto the customer login (see Sprint 1 decision in docs/backlog.md): a customer with a
 * perfectly valid password must never end up with an authenticated session on /api/admin/**, even
 * for a moment, so the role check runs before persistSession, not after.
 */
@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {

  private final AuthService authService;

  public AdminAuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(
      @Valid @RequestBody LoginRequest request,
      HttpServletRequest httpRequest,
      HttpServletResponse httpResponse) {
    Authentication authentication = authService.authenticate(request);

    // STAFF logs in through the same admin form as ADMIN - both belong in the admin area (see
    // SecurityConfig), only staff-account management itself stays ADMIN-only.
    boolean isAdminOrStaff =
        authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"))
            || authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_STAFF"));
    if (!isAdminOrStaff) {
      // Same 401 shape as a wrong password (see GlobalExceptionHandler) - a valid customer
      // credential must not tell the caller "your password is right, you're just not an admin".
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .body(new ApiError("Invalid email or password"));
    }

    authService.persistSession(authentication, httpRequest, httpResponse);
    User user = authService.findByEmail(authentication.getName());
    return ResponseEntity.ok(UserResponse.from(user));
  }
}
