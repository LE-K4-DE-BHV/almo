package de.almo.backend.auth;

import de.almo.backend.auth.dto.LoginRequest;
import de.almo.backend.auth.dto.RegisterRequest;
import de.almo.backend.mail.MailService;
import de.almo.backend.user.Role;
import de.almo.backend.user.User;
import de.almo.backend.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Holds the parts of the auth flow that are identical for customers and admins - AuthController and
 * AdminAuthController each add their own thin layer on top (the admin one rejects non-ADMIN users
 * after authenticate() succeeds, see there).
 */
@Service
public class AuthService {

  private static final SecureRandom SECURE_RANDOM = new SecureRandom();

  private final UserRepository userRepository;
  private final PasswordResetTokenRepository resetTokenRepository;
  private final PasswordEncoder passwordEncoder;
  private final AuthenticationManager authenticationManager;
  private final SecurityContextRepository securityContextRepository;
  private final MailService mailService;
  private final AuthProperties authProperties;

  public AuthService(
      UserRepository userRepository,
      PasswordResetTokenRepository resetTokenRepository,
      PasswordEncoder passwordEncoder,
      AuthenticationManager authenticationManager,
      SecurityContextRepository securityContextRepository,
      MailService mailService,
      AuthProperties authProperties) {
    this.userRepository = userRepository;
    this.resetTokenRepository = resetTokenRepository;
    this.passwordEncoder = passwordEncoder;
    this.authenticationManager = authenticationManager;
    this.securityContextRepository = securityContextRepository;
    this.mailService = mailService;
    this.authProperties = authProperties;
  }

  @Transactional
  public User register(RegisterRequest request) {
    String email = request.email().trim().toLowerCase();
    if (userRepository.existsByEmail(email)) {
      throw new EmailAlreadyRegisteredException();
    }
    User user =
        new User(
            email,
            passwordEncoder.encode(request.password()),
            request.name().trim(),
            Role.CUSTOMER);
    return userRepository.save(user);
  }

  /** Verifies credentials only - does not touch the session, see {@link #persistSession}. */
  public Authentication authenticate(LoginRequest request) {
    return authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(
            request.email().trim().toLowerCase(), request.password()));
  }

  /**
   * Writes the given Authentication into the HTTP session so subsequent requests on the same cookie
   * are recognized. Split out from {@link #authenticate} because the admin login path needs to
   * check the resulting authority *before* deciding whether a session should exist at all (see
   * AdminAuthController) - authenticating a correct password for a non-admin user must not silently
   * create a valid session.
   */
  public void persistSession(
      Authentication authentication, HttpServletRequest request, HttpServletResponse response) {
    SecurityContext context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(authentication);
    SecurityContextHolder.setContext(context);
    securityContextRepository.saveContext(context, request, response);
  }

  public User findByEmail(String email) {
    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + email));
  }

  /**
   * Always looks like it succeeded to the caller, whether or not the email exists - the alternative
   * (a distinct "no such account" response) lets an attacker enumerate registered emails. Only
   * sends anything and creates a token when a matching account actually exists.
   */
  @Transactional
  public void requestPasswordReset(String email) {
    userRepository
        .findByEmail(email.trim().toLowerCase())
        .ifPresent(
            user -> {
              String token = generateToken();
              Instant expiresAt =
                  Instant.now()
                      .plus(authProperties.getPasswordResetTokenTtlMinutes(), ChronoUnit.MINUTES);
              resetTokenRepository.save(new PasswordResetToken(user, token, expiresAt));

              String resetLink = authProperties.getFrontendUrl() + "/reset-password?token=" + token;
              mailService.send(
                  user.getEmail(),
                  "Almo Schmuck - Passwort zuruecksetzen",
                  "<p>Zum Zuruecksetzen deines Passworts (gueltig 1 Stunde): "
                      + "<a href=\""
                      + resetLink
                      + "\">"
                      + resetLink
                      + "</a></p>");
            });
  }

  @Transactional
  public void confirmPasswordReset(String token, String newPassword) {
    PasswordResetToken resetToken =
        resetTokenRepository.findByToken(token).orElseThrow(InvalidResetTokenException::new);

    if (!resetToken.isValid(Instant.now())) {
      throw new InvalidResetTokenException();
    }

    User user = resetToken.getUser();
    user.setPasswordHash(passwordEncoder.encode(newPassword));
    userRepository.save(user);

    resetToken.setUsedAt(Instant.now());
    resetTokenRepository.save(resetToken);
  }

  /** 256 bits of randomness, URL-safe so it can go straight into a link with no re-encoding. */
  private static String generateToken() {
    byte[] bytes = new byte[32];
    SECURE_RANDOM.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }
}
