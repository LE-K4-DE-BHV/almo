package de.almo.backend.order;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Where a new-order notification goes (Brevo, see OrderService) and what the customer-facing PDF
 * tells buyers to use if the admin doesn't reach out first (see spec: "falls sich der Admin nicht
 * meldet, kann der Kunde selbst nachfassen"). Placeholder defaults - see Sprint 4 decision in
 * docs/backlog.md: real values go in once they're known, via env vars, not hardcoded here.
 */
@Component
@ConfigurationProperties(prefix = "app.shop")
public class ShopContactProperties {

  private String contactEmail = "orders@almo-group.vn-nspace.de";
  private String contactWhatsapp = "+49 000 0000000";

  public String getContactEmail() {
    return contactEmail;
  }

  public void setContactEmail(String contactEmail) {
    this.contactEmail = contactEmail;
  }

  public String getContactWhatsapp() {
    return contactWhatsapp;
  }

  public void setContactWhatsapp(String contactWhatsapp) {
    this.contactWhatsapp = contactWhatsapp;
  }
}
