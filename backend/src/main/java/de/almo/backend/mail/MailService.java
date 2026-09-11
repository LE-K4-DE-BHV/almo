package de.almo.backend.mail;

/** Kept as an interface so a test double can stand in without touching Brevo. */
public interface MailService {

  void send(String toEmail, String subject, String htmlBody);
}
