import { test, expect } from '@playwright/test'

test('la page affiche le titre du jeu', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Big Bang Clicker' })).toBeVisible()
})
