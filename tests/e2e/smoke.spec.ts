import { test, expect } from '@playwright/test'

test("la page affiche l'ère de départ", async ({ page }) => {
  await page.goto('/')
  // 'Big Bang' est le nom de l'ère 0, identique en FR et EN.
  await expect(page.getByRole('heading', { name: 'Big Bang' })).toBeVisible()
})
