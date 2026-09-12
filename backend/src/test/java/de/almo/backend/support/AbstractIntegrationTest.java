package de.almo.backend.support;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Base for tests that need the real app wired up against a real Postgres/Redis instead of mocking
 * JdbcClient/JPA away - see Sprint 6 decision in docs/backlog.md. Containers are started once per
 * JVM (static fields, never stopped explicitly - Testcontainers' Ryuk sidecar reaps them when the
 * test JVM exits) and shared across every subclass, which is far cheaper than a fresh Postgres per
 * test class without risking cross-test interference: subclasses are expected to use unique data
 * (random emails/keys) rather than relying on an empty schema, since the container - and whatever a
 * previous test class left in it - outlives any single test class.
 *
 * <p><b>Deliberately not {@code @Testcontainers}/{@code @Container}:</b> that JUnit5 extension
 * manages a container's lifecycle per test class - it stops an {@code @Container}-annotated field
 * (static or not) in {@code afterAll()} and restarts it (fresh container, fresh mapped port) for
 * the next class. Combined with Spring's test-context caching (which reuses the ApplicationContext,
 * DataSource included, across subclasses since they all share this exact configuration), that
 * silently broke every test class after the first: Spring kept talking to the first class's
 * already-stopped container on its now-dead port instead of the freshly started one. This is
 * Testcontainers' documented "singleton containers" pattern instead - a plain static field, started
 * once in a static initializer, never touched by an extension.
 *
 * <p>Flyway runs its full migration set (including the dev-only seed data from V4, see that
 * migration's own comment) against the container on context startup, exactly like a real
 * docker-compose run - nothing here recreates the schema by hand.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
public abstract class AbstractIntegrationTest {

  @ServiceConnection
  static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

  static final GenericContainer<?> REDIS =
      new GenericContainer<>(DockerImageName.parse("redis:7-alpine")).withExposedPorts(6379);

  static {
    POSTGRES.start();
    REDIS.start();
  }

  @DynamicPropertySource
  static void redisProperties(DynamicPropertyRegistry registry) {
    // No dedicated Testcontainers Redis module in the BOM (see pom.xml) - a generic container
    // plus explicit host/port properties is simpler than pulling in another module for one line
    // of config, and Spring Boot's @ServiceConnection support for redis needs the container class
    // to be recognized as a redis image, which withExposedPorts alone doesn't guarantee here.
    registry.add("spring.data.redis.host", REDIS::getHost);
    registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));
  }
}
