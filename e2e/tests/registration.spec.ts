import { test, expect, uniqueEmail } from './fixtures'

test('a visitor can register a new account and lands on their account page', async ({ page }) => {
  const email = uniqueEmail('register')

  await page.goto('/register')
  await page.getByLabel('Name').fill('E2E Tester')
  await page.getByLabel('E-Mail').fill(email)
  await page.getByLabel('Passwort').fill('Passw0rd!23')
  await page.getByRole('button', { name: 'Konto erstellen' }).click()

  await expect(page).toHaveURL(/\/account$/)
  await expect(page.getByText(email)).toBeVisible()
})

test('registering with an already-used email shows an error instead of navigating away', async ({
  page,
}) => {
  const email = uniqueEmail('duplicate')

  // First registration succeeds and logs the user in - log back out so the second attempt below
  // hits the real "already registered" path instead of "already logged in".
  await page.goto('/register')
  await page.getByLabel('Name').fill('E2E Tester')
  await page.getByLabel('E-Mail').fill(email)
  await page.getByLabel('Passwort').fill('Passw0rd!23')
  await page.getByRole('button', { name: 'Konto erstellen' }).click()
  await expect(page).toHaveURL(/\/account$/)
  await page.getByRole('button', { name: 'Logout' }).click()

  await page.goto('/register')
  await page.getByLabel('Name').fill('E2E Tester Two')
  await page.getByLabel('E-Mail').fill(email)
  await page.getByLabel('Passwort').fill('AnotherPassw0rd!23')
  await page.getByRole('button', { name: 'Konto erstellen' }).click()

  await expect(page).toHaveURL(/\/register$/)
  await expect(page.getByRole('alert')).toBeVisible()
})
