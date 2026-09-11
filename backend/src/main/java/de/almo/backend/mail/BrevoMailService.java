package de.almo.backend.mail;

import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Talks to Brevo's transactional email REST API directly (https://api.brevo.com/v3/smtp/email)
 * rather than going through SMTP - one HTTP call, no mail-session/connection-pool setup needed.
 */
@Service
public class BrevoMailService implements MailService {

  private static final Logger log = LoggerFactory.getLogger(BrevoMailService.class);
  private static final String BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

  private final RestClient restClient;
  private final BrevoProperties properties;

  public BrevoMailService(BrevoProperties properties) {
    this.properties = properties;
    this.restClient = RestClient.create();
  }

  @Override
  public void send(String toEmail, String subject, String htmlBody) {
    if (properties.getApiKey().isBlank()) {
      // No key configured (local dev default, see infra/.env.example) - log instead of failing
      // the request, so the reset-token flow is still testable without a real Brevo account.
      log.warn("BREVO_API_KEY not set, skipping email to {} (subject: {})", toEmail, subject);
      return;
    }

    Map<String, Object> payload =
        Map.of(
            "sender",
            Map.of("name", properties.getSenderName(), "email", properties.getSenderEmail()),
            "to",
            List.of(Map.of("email", toEmail)),
            "subject",
            subject,
            "htmlContent",
            htmlBody);

    try {
      restClient
          .post()
          .uri(BREVO_ENDPOINT)
          .header("api-key", properties.getApiKey())
          .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
          .body(payload)
          .retrieve()
          .toBodilessEntity();
    } catch (Exception e) {
      // A mail-provider outage shouldn't surface as a 500 to the caller (e.g. password reset
      // must still report success either way, see AuthService - it must not reveal whether an
      // account exists). Logging is what makes a real delivery failure visible to us instead.
      log.error("Failed to send email to {} via Brevo", toEmail, e);
    }
  }
}
