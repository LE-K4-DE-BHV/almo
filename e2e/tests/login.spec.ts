import { test, expect, uniqueEmail, registerNewUser, login } from './fixtures'

test('a registered user can log out and log back in', async ({ page }) => {
  const email = uniqueEmail('login')
  const password = 'Passw0rd!23'

  await registerNewUser(page, { name: 'E2E Tester', email, password })
  await expect(page).toHaveURL(/\/account$/)
  await page.getByRole('button', { name: 'Logout' }).click()

  await login(page, email, password)

  await expect(page).toHaveURL(/\/account$/)
  await expect(page.getByText(email)).toBeVisible()
})

test('logging in with the wrong password shows an error', async ({ page }) => {
  const email = uniqueEmail('wrong-password')

  await registerNewUser(page, { name: 'E2E Tester', email, password: 'Passw0rd!23' })
  await expect(page).toHaveURL(/\/account$/)
  await page.getByRole('button', { name: 'Logout' }).click()

  await login(page, email, 'DefinitelyWrong123')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('alert')).toBeVisible()
})
