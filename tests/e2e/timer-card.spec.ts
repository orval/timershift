import { expect, test } from '@playwright/test'

test('toggles play/pause when clicking the timer display', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear()
  })

  await page.goto('/')

  await page.getByRole('button', { name: /add new timer/i }).click()
  await page.getByLabel(/timer name/i).fill('12345678')
  await page.getByRole('button', { name: /create/i }).click()

  const timerDisplay = page.locator('.timer-card .timer-display').first()
  await expect(timerDisplay).toBeVisible()

  const toggleButton = page.locator('.timer-actions').getByRole('button', { name: /pause timer/i })
  await expect(toggleButton).toBeVisible()
  await timerDisplay.click()
  await expect(page.locator('.timer-actions').getByRole('button', { name: /start timer/i })).toBeVisible()
  await timerDisplay.click()
  await expect(page.locator('.timer-actions').getByRole('button', { name: /pause timer/i })).toBeVisible()
})

test('shows copied state when clicking the timer copy button', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear()
  })
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: async () => {} },
      configurable: true
    })
  })

  await page.goto('/')

  await page.getByRole('button', { name: /add new timer/i }).click()
  await page.getByLabel(/timer name/i).fill('Focus')
  await page.getByRole('button', { name: /create/i }).click()

  const copyButton = page.locator('.timer-copy-btn').first()
  await expect(copyButton).toHaveAttribute('aria-label', /copy timer name/i)
  await copyButton.click()
  await expect(copyButton).toHaveAttribute('aria-label', /copied timer name/i)
})
