import { test, expect, uniqueEmail, registerNewUser } from './fixtures'

test('a visitor can register a new account and lands on their account page', async ({ page }) => {
  const email = uniqueEmail('register')

  await registerNewUser(page, { name: 'E2E Tester', email, password: 'Passw0rd!23' })

  await expect(page).toHaveURL(/\/account$/)
  await expect(page.getByText(email)).toBeVisible()
})

test('registering with an already-used email shows an error instead of navigating away', async ({
  page,
}) => {
  const email = uniqueEmail('duplicate')

  // First registration succeeds and logs the user in - log back out so the second attempt below
  // hits the real "already registered" path instead of "already logged in".
  await registerNewUser(page, { name: 'E2E Tester', email, password: 'Passw0rd!23' })
  await expect(page).toHaveURL(/\/account$/)
  await page.getByRole('button', { name: 'Logout' }).click()

  await registerNewUser(page, {
    name: 'E2E Tester Two',
    email,
    password: 'AnotherPassw0rd!23',
  })

  await expect(page).toHaveURL(/\/register$/)
  await expect(page.getByRole('alert')).toBeVisible()
})
