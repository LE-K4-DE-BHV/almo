package de.almo.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the Almo shop backend.
 *
 * <p>Runtime configuration (DB, Redis, server port) is read from environment variables with
 * localhost defaults, see {@code application.properties}. This lets the same jar run unchanged in
 * docker-compose (env vars injected by the compose file) and directly on a dev machine (defaults
 * kick in).
 */
@SpringBootApplication
public class BackendApplication {

  public static void main(String[] args) {
    SpringApplication.run(BackendApplication.class, args);
  }
}
