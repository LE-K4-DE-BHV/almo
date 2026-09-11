package de.almo.backend.mail;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "brevo")
public class BrevoProperties {

  /** Empty in local dev (see infra/.env.example) - BrevoMailService no-ops when this is blank. */
  private String apiKey = "";

  private String senderEmail = "no-reply@almo-group.vn-nspace.de";
  private String senderName = "Almo Schmuck";

  public String getApiKey() {
    return apiKey;
  }

  public void setApiKey(String apiKey) {
    this.apiKey = apiKey;
  }

  public String getSenderEmail() {
    return senderEmail;
  }

  public void setSenderEmail(String senderEmail) {
    this.senderEmail = senderEmail;
  }

  public String getSenderName() {
    return senderName;
  }

  public void setSenderName(String senderName) {
    this.senderName = senderName;
  }
}
