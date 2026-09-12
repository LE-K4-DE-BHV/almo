import { test, expect, uniqueEmail } from './fixtures'

test('a registered user can log out and log back in', async ({ page }) => {
  const email = uniqueEmail('login')
  const password = 'Passw0rd!23'

  await page.goto('/register')
  await page.getByLabel('Name').fill('E2E Tester')
  await page.getByLabel('E-Mail').fill(email)
  await page.getByLabel('Passwort').fill(password)
  await page.getByRole('button', { name: 'Konto erstellen' }).click()
  await expect(page).toHaveURL(/\/account$/)
  await page.getByRole('button', { name: 'Logout' }).click()

  await page.goto('/login')
  await page.getByLabel('E-Mail').fill(email)
  await page.getByLabel('Passwort').fill(password)
  await page.getByRole('button', { name: 'Einloggen' }).click()

  await expect(page).toHaveURL(/\/account$/)
  await expect(page.getByText(email)).toBeVisible()
})

test('logging in with the wrong password shows an error', async ({ page }) => {
  const email = uniqueEmail('wrong-password')

  await page.goto('/register')
  await page.getByLabel('Name').fill('E2E Tester')
  await page.getByLabel('E-Mail').fill(email)
  await page.getByLabel('Passwort').fill('Passw0rd!23')
  await page.getByRole('button', { name: 'Konto erstellen' }).click()
  await expect(page).toHaveURL(/\/account$/)
  await page.getByRole('button', { name: 'Logout' }).click()

  await page.goto('/login')
  await page.getByLabel('E-Mail').fill(email)
  await page.getByLabel('Passwort').fill('DefinitelyWrong123')
  await page.getByRole('button', { name: 'Einloggen' }).click()

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('alert')).toBeVisible()
})
