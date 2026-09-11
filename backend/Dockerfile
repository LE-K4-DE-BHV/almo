# Multi-stage build: compile with the full JDK, ship only the JRE + jar.
# Keeps the final image smaller and avoids shipping build tooling to prod.

FROM eclipse-temurin:25-jdk AS build
WORKDIR /app
# Copy wrapper/pom first and resolve dependencies before copying source, so
# Docker's layer cache reuses the (slow) dependency download step as long as
# pom.xml hasn't changed, even if source files have.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw -q -B dependency:go-offline
COPY src/ src/
RUN ./mvnw -q -B package -DskipTests

FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# Must match server.port in application.properties / SERVER_PORT env var.
EXPOSE 8094
ENTRYPOINT ["java", "-jar", "app.jar"]
