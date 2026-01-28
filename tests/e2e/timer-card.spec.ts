import { expect, test } from '@playwright/test'

test('toggles play/pause when clicking the timer display', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear()
  })

  await page.goto('/')

  await page.getByRole('button', { name: /add new timer/i }).click()
  await page.getByLabel(/timer name/i).fill('12345678')
  await page.getByRole('button', { name: /create/i }).click()

  // Wait for the timer card to appear
  const timerCard = page.locator('.timer-card').first()
  await expect(timerCard).toBeVisible()
  
  // The timer display is the time text element (p tag with tabular-nums class)
  const timerDisplay = timerCard.locator('p.tabular-nums').first()
  await expect(timerDisplay).toBeVisible()

  // Find the toggle button within the timer card to avoid selecting the card itself
  const toggleButton = timerCard.locator('button[aria-label*="Pause timer"]')
  await expect(toggleButton).toBeVisible()
  await timerDisplay.click()
  await expect(timerCard.locator('button[aria-label*="Start timer"]')).toBeVisible()
  await timerDisplay.click()
  await expect(timerCard.locator('button[aria-label*="Pause timer"]')).toBeVisible()
})

test('shows copied state when clicking the timer copy button', async ({ page, context }) => {
  // Grant clipboard permissions
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  
  await page.addInitScript(() => {
    window.localStorage.clear()
  })

  // Listen for console messages to debug clipboard issues
  page.on('console', msg => console.log('PAGE LOG:', msg.text()))

  await page.goto('/')

  await page.getByRole('button', { name: /add new timer/i }).click()
  await page.getByLabel(/timer name/i).fill('Focus')
  await page.getByRole('button', { name: /create/i }).click()

  // Wait for the timer card to appear
  const timerCard = page.locator('.timer-card').first()
  await expect(timerCard).toBeVisible()

  // Find the copy button within the timer card using a stable role locator
  const copyButton = timerCard.getByRole('button', { name: /copy timer name|copied timer name/i })
  await expect(copyButton).toHaveAttribute('aria-label', /copy timer name/i)
  await copyButton.click()
  
  // Wait for the aria-label to change after the async clipboard operation
  await expect(copyButton).toHaveAttribute('aria-label', /copied timer name/i, { timeout: 2000 })
})
