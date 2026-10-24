import { expect, test } from '@playwright/test'

test('shows undo toast when deleting a timer', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear()
  })

  await page.goto('/')

  await page.getByRole('button', { name: /add new timer/i }).click()
  await page.getByLabel(/timer name/i).fill('Test Timer')
  await page.getByRole('button', { name: /create/i }).click()

  // Wait for the timer card to appear
  const timerCard = page.locator('.timer-card').first()
  await expect(timerCard).toBeVisible()

  // Find and click the delete button (X button with aria-label 'Remove timer')
  const deleteButton = timerCard.getByRole('button', { name: /remove timer/i })
  await expect(deleteButton).toBeVisible()
  await deleteButton.click()

  // Verify the timer card is removed
  await expect(timerCard).not.toBeVisible()

  // Verify the toast notification appears with the delete message
  const toast = page.locator('[role="status"]')
  await expect(toast).toBeVisible()
  await expect(toast).toContainText('"Test Timer" deleted')

  // Verify the Undo button is visible in the toast
  const undoButton = toast.getByRole('button', { name: /undo/i })
  await expect(undoButton).toBeVisible()

  // Click undo and verify the timer is restored
  await undoButton.click()
  // Wait for the timer to be restored
  await page.waitForTimeout(100)
  await expect(timerCard).toBeVisible()
  await expect(timerCard).toContainText('Test Timer')
})

test('toast auto-dismisses after 5 seconds', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear()
  })

  await page.goto('/')

  await page.getByRole('button', { name: /add new timer/i }).click()
  await page.getByLabel(/timer name/i).fill('Quick Delete')
  await page.getByRole('button', { name: /create/i }).click()

  // Wait for the timer card to appear
  const timerCard = page.locator('.timer-card').first()
  await expect(timerCard).toBeVisible()

  // Delete the timer
  const deleteButton = timerCard.getByRole('button', { name: /remove timer/i })
  await deleteButton.click()

  // Verify toast appears
  const toast = page.locator('[role="status"]')
  await expect(toast).toBeVisible()

  // Wait 5.5 seconds and verify toast is gone
  await page.waitForTimeout(5500)
  await expect(toast).not.toBeVisible()
})
