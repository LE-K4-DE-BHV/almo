import { defineConfig, devices } from '@playwright/test'

/**
 * E2E tests run against an already-running docker-compose stack (see Sprint 6 decision in
 * docs/backlog.md and the CI workflow) - this config doesn't spin one up itself. Locally: run
 * `docker compose up -d` from the repo root first, then `npm test` from this directory.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  globalSetup: './global-setup.ts',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:8093',
    trace: 'on-first-retry',
    // Pins the language the app's i18next LanguageDetector picks (see frontend/src/i18n/index.ts)
    // regardless of the runner's own OS locale - tests assert on specific German label text, and
    // German is the app's fallback/source language anyway.
    locale: 'de-DE',
  },
  // Three browser engines + two mobile viewports - covers the Sprint 6 responsive-/
  // cross-browser-check decision (docs/backlog.md) without a separate test suite for it.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],
})
