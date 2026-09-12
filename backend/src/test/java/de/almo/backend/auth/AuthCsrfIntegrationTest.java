package de.almo.backend.auth;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import de.almo.backend.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Covers the CSRF handling that every previous sprint only checked manually via curl (forgetting
 * the X-XSRF-TOKEN header was a recurring mistake during that manual testing, see Sprint 5 notes in
 * docs/backlog.md) - now pinned down as an automated regression check.
 *
 * <p>{@code .csrf(csrf -> csrf.spa())} (see SecurityConfig) issues the XSRF-TOKEN cookie on every
 * response, not just from a dedicated endpoint - any request through the customer filter chain
 * works to obtain one, matching how the frontend's apiFetch/client.ts reads it.
 */
class AuthCsrfIntegrationTest extends AbstractIntegrationTest {

  @Autowired private MockMvc mockMvc;

  private String fetchCsrfCookie() throws Exception {
    MvcResult result = mockMvc.perform(get("/api/auth/me")).andReturn();
    Cookie cookie = result.getResponse().getCookie("XSRF-TOKEN");
    if (cookie == null) {
      throw new IllegalStateException("XSRF-TOKEN cookie was not issued");
    }
    return cookie.getValue();
  }

  @Test
  void registerWithoutCsrfTokenIsRejected() throws Exception {
    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"email":"no-csrf-%s@example.com","password":"Passw0rd!23","name":"Test"}
                    """
                        .formatted(UUID.randomUUID())))
        .andExpect(status().isForbidden());
  }

  @Test
  void registerWithMatchingCsrfCookieAndHeaderSucceeds() throws Exception {
    String csrfToken = fetchCsrfCookie();
    String email = "with-csrf-" + UUID.randomUUID() + "@example.com";

    mockMvc
        .perform(
            post("/api/auth/register")
                .cookie(new Cookie("XSRF-TOKEN", csrfToken))
                .header("X-XSRF-TOKEN", csrfToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"email":"%s","password":"Passw0rd!23","name":"Test"}
                    """
                        .formatted(email)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email", is(email)))
        .andExpect(jsonPath("$.role", is("CUSTOMER")));
  }

  @Test
  void registerWithMismatchedCsrfHeaderIsRejected() throws Exception {
    String csrfToken = fetchCsrfCookie();

    mockMvc
        .perform(
            post("/api/auth/register")
                .cookie(new Cookie("XSRF-TOKEN", csrfToken))
                .header("X-XSRF-TOKEN", "not-the-real-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"email":"mismatch-%s@example.com","password":"Passw0rd!23","name":"Test"}
                    """
                        .formatted(UUID.randomUUID())))
        .andExpect(status().isForbidden());
  }
}
