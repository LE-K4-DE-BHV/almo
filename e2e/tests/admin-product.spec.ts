import { test, expect, ADMIN_EMAIL, ADMIN_PASSWORD } from './fixtures'

test('an admin can create a product and it shows up in the public catalog', async ({ page }) => {
  const productName = `E2E Product ${Date.now()}`

  await page.goto('/admin/login')
  await page.getByLabel('Email').fill(ADMIN_EMAIL)
  await page.getByLabel('Password').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Login' }).click()

  await expect(page).toHaveURL(/\/admin\/products$/)
  await page.getByRole('link', { name: 'New product' }).click()

  await expect(page).toHaveURL(/\/admin\/products\/new$/)
  // Categories come from the dev seed data (V4 migration) - the first option is always
  // "Select…" (see AdminProductFormPage), so the first real category is index 1.
  await page.getByLabel('Category').selectOption({ index: 1 })
  await page.getByLabel('Price (EUR)').fill('19.90')
  await page.getByLabel('Stock quantity').fill('5')
  await page.getByLabel('Name').fill(productName)
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page).toHaveURL(/\/admin\/products\/\d+$/)

  await page.goto('/admin/products')
  await expect(page.getByText(productName)).toBeVisible()

  // Same product, seen through the customer-facing read API (see ProductSearchRepository) -
  // proves the write actually landed in the shared products table, not just the admin form state.
  await page.goto('/shop')
  await page.getByPlaceholder('Produkte suchen...').fill(productName)
  await page.getByPlaceholder('Produkte suchen...').press('Enter')
  // Not getByText(productName) - the page title echoes the search term in quotes
  // (see ShopPage's `search ? "${search}"` : ...), which also matches and makes this ambiguous.
  await expect(page.getByRole('heading', { level: 3, name: productName })).toBeVisible()
})
