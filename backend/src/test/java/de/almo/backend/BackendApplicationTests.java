package de.almo.backend;

import de.almo.backend.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;

/**
 * Placeholder smoke test: fails fast if the Spring context can't wire up (missing bean, broken
 * config, unreachable DB/Redis at startup). Extends AbstractIntegrationTest (Sprint 6, see
 * docs/backlog.md) instead of using a bare @SpringBootTest - without a real Postgres/Redis behind
 * it, this used to only work because CI never actually ran the test suite; now that `./mvnw test`
 * is a real CI stage, it needs the same Testcontainers-backed context every other integration test
 * uses.
 */
class BackendApplicationTests extends AbstractIntegrationTest {

  @Test
  void contextLoads() {}
}
