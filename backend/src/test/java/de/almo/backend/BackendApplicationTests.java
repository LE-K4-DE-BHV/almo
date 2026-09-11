package de.almo.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Placeholder smoke test: fails fast if the Spring context can't wire up (missing bean, broken
 * config, unreachable DB/Redis at startup). Real integration tests land in Sprint 1 once there's
 * actual business logic to exercise (see docs/backlog.md).
 */
@SpringBootTest
class BackendApplicationTests {

  @Test
  void contextLoads() {}
}
