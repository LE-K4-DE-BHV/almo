package de.almo.backend.auth;

import de.almo.backend.auth.dto.LoginRequest;
import de.almo.backend.auth.dto.PasswordResetConfirmDto;
import de.almo.backend.auth.dto.PasswordResetRequestDto;
import de.almo.backend.auth.dto.RegisterRequest;
import de.almo.backend.auth.dto.UpdateProfileRequest;
import de.almo.backend.auth.dto.UserResponse;
import de.almo.backend.cart.CartService;
import de.almo.backend.user.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Customer-facing auth endpoints, permitAll under /api/auth/** (see SecurityConfig). */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;
  private final CartService cartService;

  public AuthController(AuthService authService, CartService cartService) {
    this.authService = authService;
    this.cartService = cartService;
  }

  @PostMapping("/register")
  public UserResponse register(
      @Valid @RequestBody RegisterRequest request,
      HttpServletRequest httpRequest,
      HttpServletResponse httpResponse) {
    User user = authService.register(request);
    // Registering logs the user in immediately, matching the old localStorage-based flow
    // (almofrontenddesign/js/auth.js registerUser()) - no separate "please log in" step.
    Authentication authentication =
        authService.authenticate(new LoginRequest(request.email(), request.password()));
    // Captured before persistSession(), which rotates the session id (session fixation
    // protection) - the guest cart is filed under the pre-rotation id.
    String guestSessionId = httpRequest.getSession(true).getId();
    authService.persistSession(authentication, httpRequest, httpResponse);
    cartService.mergeGuestCartIntoUser(guestSessionId, user.getId());
    return UserResponse.from(user);
  }

  @PostMapping("/login")
  public UserResponse login(
      @Valid @RequestBody LoginRequest request,
      HttpServletRequest httpRequest,
      HttpServletResponse httpResponse) {
    Authentication authentication = authService.authenticate(request);
    String guestSessionId = httpRequest.getSession(true).getId();
    authService.persistSession(authentication, httpRequest, httpResponse);
    User user = authService.findByEmail(authentication.getName());
    cartService.mergeGuestCartIntoUser(guestSessionId, user.getId());
    return UserResponse.from(user);
  }

  /**
   * Lets the SPA figure out on page load whether the session cookie it's holding is still valid,
   * without guessing from cookie presence alone (the cookie can exist and still be an expired/
   * invalidated session). {@code /api/auth/**} is permitAll (see SecurityConfig), so an anonymous
   * caller reaches this method with an {@link AnonymousAuthenticationToken}, not a null
   * Authentication - that's what's actually checked for "not logged in".
   */
  @GetMapping("/me")
  public ResponseEntity<UserResponse> me(Authentication authentication) {
    if (authentication == null || authentication instanceof AnonymousAuthenticationToken) {
      return ResponseEntity.status(401).build();
    }
    return ResponseEntity.ok(UserResponse.from(authService.findByEmail(authentication.getName())));
  }

  /** Same-table-for-both-roles shape as {@link #deleteAccount} - see AuthService.updateProfile. */
  @PatchMapping("/me")
  public UserResponse updateProfile(
      @Valid @RequestBody UpdateProfileRequest request,
      HttpServletRequest httpRequest,
      HttpServletResponse httpResponse,
      Authentication authentication) {
    User user =
        authService.updateProfile(authentication.getName(), request, httpRequest, httpResponse);
    return UserResponse.from(user);
  }

  @DeleteMapping("/me")
  public ResponseEntity<Void> deleteAccount(
      HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
    authService.deleteAccount(authentication.getName());
    // The account is gone - whatever session referenced it must go too.
    new SecurityContextLogoutHandler().logout(request, response, authentication);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(
      HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
    new SecurityContextLogoutHandler().logout(request, response, authentication);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/password-reset/request")
  public ResponseEntity<Void> requestPasswordReset(
      @Valid @RequestBody PasswordResetRequestDto request) {
    authService.requestPasswordReset(request.email());
    // 202: "we accepted this", not "we found an account and emailed it" - see AuthService.
    return ResponseEntity.accepted().build();
  }

  @PostMapping("/password-reset/confirm")
  public ResponseEntity<Void> confirmPasswordReset(
      @Valid @RequestBody PasswordResetConfirmDto request) {
    authService.confirmPasswordReset(request.token(), request.newPassword());
    return ResponseEntity.noContent().build();
  }
}
