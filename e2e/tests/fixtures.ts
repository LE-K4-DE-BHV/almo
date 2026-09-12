import { test as base, expect, type Page } from '@playwright/test'

/**
 * Every spec imports `test`/`expect` from here instead of '@playwright/test' directly, so the
 * German-language assertions throughout this suite don't depend on the app's i18next language
 * detection (see frontend/src/i18n/index.ts) guessing right. Playwright's own `locale: 'de-DE'`
 * context option (see playwright.config.ts) isn't enough on its own - the app's index.html ships
 * a static `lang="en"`, and i18next-browser-languagedetector's `htmlTag` check can win over the
 * navigator-based one depending on detector order, landing the app in English regardless of the
 * emulated locale. Setting localStorage before the app's first script runs sidesteps that
 * entirely - i18next reads that itself and prefers it over both.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('i18nextLng', 'de')
    })
    await use(page)
  },
})

export { expect }

/** Shared across specs and global-setup.ts - a fixed, well-known admin account rather than one
    created per test run, since promoting a user to ADMIN needs a direct DB write (see
    global-setup.ts) that only needs to happen once. */
export const ADMIN_EMAIL = 'e2e-admin@example.com'
export const ADMIN_PASSWORD = 'Passw0rd!23e2e'
export const ADMIN_NAME = 'E2E Admin'

/** A fresh, random customer email per test run/worker - registration/login specs must not
    collide with data left over from a previous local run (the dev DB volume isn't necessarily
    wiped between manual runs, unlike a throwaway CI container). */
export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

/**
 * Adds the first product on /shop to the cart and waits for the add to actually land server-side
 * before returning. `addItem()` in CartProvider is async - clicking the button only dispatches the
 * click, it doesn't wait for the POST it triggers to finish, so navigating away right after
 * `.click()` can race ahead of the request that actually creates the cart item.
 */
export async function addFirstProductToCart(page: Page): Promise<string> {
  const firstCard = page.locator('article').first()
  await expect(firstCard).toBeVisible()
  const productName = await firstCard.locator('h3').innerText()

  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes('/api/cart/items') && res.request().method() === 'POST',
    ),
    firstCard.getByTitle('In den Warenkorb').click(),
  ])

  return productName
}
