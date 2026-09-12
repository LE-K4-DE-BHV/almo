package de.almo.backend.newsletter;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Public endpoint, permitAll under /api/newsletter (see SecurityConfig) - no account needed. */
@RestController
@RequestMapping("/api/newsletter")
public class NewsletterController {

  private final NewsletterRepository newsletterRepository;

  public NewsletterController(NewsletterRepository newsletterRepository) {
    this.newsletterRepository = newsletterRepository;
  }

  @PostMapping
  public ResponseEntity<Void> subscribe(@Valid @RequestBody NewsletterSubscribeRequest request) {
    newsletterRepository.subscribe(request.email());
    return ResponseEntity.accepted().build();
  }
}
