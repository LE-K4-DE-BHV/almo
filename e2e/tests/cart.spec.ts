import { test, expect, addFirstProductToCart } from './fixtures'

test('a guest can add a product to the cart from the shop grid', async ({ page }) => {
  await page.goto('/shop')

  // Cart works without an account (see CartController/CartOwner - session-bound for guests, see
  // Sprint 3 decision in docs/backlog.md), so no login step here.
  const productName = await addFirstProductToCart(page)

  await page.goto('/cart')
  await expect(page.getByText(productName)).toBeVisible()
})

test('removing the only item in the cart shows the empty-cart state', async ({ page }) => {
  await page.goto('/shop')
  await addFirstProductToCart(page)

  await page.goto('/cart')
  await page.getByRole('button', { name: 'Entfernen' }).click()

  await expect(page.getByText('Dein Warenkorb ist leer.')).toBeVisible()
})
