import { test, expect, uniqueEmail, registerNewUser, addFirstProductToCart } from './fixtures'

test('a logged-in customer can complete checkout end to end', async ({ page }) => {
  const email = uniqueEmail('checkout')

  await registerNewUser(page, { name: 'Checkout Tester', email, password: 'Passw0rd!23' })
  await expect(page).toHaveURL(/\/account$/)

  await page.goto('/shop')
  await addFirstProductToCart(page)

  await page.goto('/cart')
  await page.getByRole('button', { name: 'Zur Kasse' }).click()

  await expect(page).toHaveURL(/\/checkout$/)
  await page.getByLabel('Name').fill('Checkout Tester')
  await page.getByLabel('Adresse').fill('Teststraße 1')
  await page.getByLabel('Stadt').fill('Berlin')
  await page.getByRole('button', { name: 'Bestellung abschicken' }).click()

  await expect(page).toHaveURL(/\/order-confirmation\/\d+$/)
  await expect(page.getByText('Bestellung eingegangen')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Bestell-PDF herunterladen' })).toBeVisible()

  // The order actually landed in the account's order history, not just on the confirmation
  // screen - a real end-to-end signal that checkout persisted, not just navigated.
  await page.goto('/account')
  await expect(page.getByText('ALM-')).toBeVisible()
})
