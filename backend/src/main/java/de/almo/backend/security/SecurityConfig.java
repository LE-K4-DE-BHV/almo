package de.almo.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

/**
 * Two independent filter chains instead of one shared one, per the Sprint 1 decision in
 * docs/backlog.md: admin traffic and customer traffic are authorized completely separately, so a
 * bug in one set of rules can't accidentally widen access on the other. Spring Security picks the
 * first chain whose {@code securityMatcher} matches the request, so the admin chain (narrower path,
 * higher priority) must be declared with a lower @Order number than the catch-all one.
 */
@Configuration
public class SecurityConfig {

  /**
   * OWASP's current (2024+) recommendation over bcrypt: resistant to GPU/ASIC cracking in a way
   * bcrypt no longer is. `defaultsForSpringSecurity_v5_8()` is Spring Security's own tuned
   * parameter set (16 MiB memory, 2 iterations, 1 thread) - in line with OWASP's stated minimums.
   */
  @Bean
  public PasswordEncoder passwordEncoder() {
    return Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
  }

  /**
   * Same manager backs both the customer and admin login endpoints - "is this email/password
   * combination valid" is one question, independent of which login endpoint asked it. The admin
   * endpoint layers its own role check on top after authentication succeeds (see
   * AdminAuthController), it doesn't need a second manager to do that.
   */
  @Bean
  public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
      throws Exception {
    return config.getAuthenticationManager();
  }

  /**
   * Exposed as its own bean (not left implicit inside each HttpSecurity chain) so AuthService can
   * inject the exact same repository that the filter chains read from - login is done by a plain
   * REST controller calling AuthenticationManager directly (no form-login flow to hook into), so
   * something has to explicitly write the resulting Authentication into the session.
   */
  @Bean
  public SecurityContextRepository securityContextRepository() {
    return new HttpSessionSecurityContextRepository();
  }

  @Bean
  @Order(1)
  public SecurityFilterChain adminFilterChain(
      HttpSecurity http, SecurityContextRepository securityContextRepository) throws Exception {
    http.securityMatcher("/api/admin/**")
        .csrf(csrf -> csrf.spa())
        .securityContext(context -> context.securityContextRepository(securityContextRepository))
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
        .authorizeHttpRequests(
            (AuthorizeHttpRequestsConfigurer<HttpSecurity>
                        .AuthorizationManagerRequestMatcherRegistry
                    registry) ->
                registry
                    // Login itself can't require being already authenticated as admin.
                    .requestMatchers(HttpMethod.POST, "/api/admin/auth/login")
                    .permitAll()
                    .anyRequest()
                    .hasRole("ADMIN"));
    return http.build();
  }

  @Bean
  @Order(2)
  public SecurityFilterChain customerFilterChain(
      HttpSecurity http, SecurityContextRepository securityContextRepository) throws Exception {
    http.csrf(csrf -> csrf.spa())
        .securityContext(context -> context.securityContextRepository(securityContextRepository))
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
        .authorizeHttpRequests(
            (AuthorizeHttpRequestsConfigurer<HttpSecurity>
                        .AuthorizationManagerRequestMatcherRegistry
                    registry) ->
                registry
                    .requestMatchers("/api/auth/**")
                    .permitAll()
                    .requestMatchers("/actuator/health")
                    .permitAll()
                    // Browsing the catalog needs no account - only GET is opened here; write
                    // access to these paths (Sprint 5 admin CRUD) will need its own, narrower
                    // rule once it exists, not a blanket permitAll on the whole path.
                    .requestMatchers(HttpMethod.GET, "/api/products/**")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/categories/**")
                    .permitAll()
                    .anyRequest()
                    .authenticated());
    return http.build();
  }
}
