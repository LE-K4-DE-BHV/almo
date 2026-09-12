package de.almo.backend.newsletter;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class NewsletterRepository {

  private final JdbcClient jdbcClient;

  public NewsletterRepository(JdbcClient jdbcClient) {
    this.jdbcClient = jdbcClient;
  }

  /**
   * ON CONFLICT DO NOTHING instead of a pre-check + insert - resubscribing with an email that's
   * already in the table is a normal, harmless action (see Sprint 6 decision in docs/backlog.md: no
   * double opt-in, so there's no confirmation step that would make a duplicate attempt meaningful),
   * not an error worth surfacing to the visitor.
   */
  public void subscribe(String email) {
    jdbcClient
        .sql("INSERT INTO newsletter_subscribers (email) VALUES (:email) ON CONFLICT DO NOTHING")
        .param("email", email)
        .update();
  }
}
