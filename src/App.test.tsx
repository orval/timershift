import { render, screen, within } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import App from './App'

test('renders the default timer label', () => {
  render(<App />)
  expect(screen.getAllByText('Timer 1').length).toBeGreaterThan(0)
})

test('opens the add timer modal', async () => {
  render(<App />)
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: /add new timer/i }))
  expect(screen.getByRole('heading', { name: /new timer/i })).toBeInTheDocument()
})

test('creates a timer from the add modal', async () => {
  render(<App />)
  const user = userEvent.setup()

  await user.click(screen.getByRole('button', { name: /add new timer/i }))
  const dialog = screen.getByRole('dialog')
  const input = within(dialog).getByRole('textbox', { name: /timer name/i })

  await user.type(input, 'Pomodoro')
  await user.click(within(dialog).getByRole('button', { name: /create/i }))

  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByText('Pomodoro', { selector: 'button' })).toBeInTheDocument()
})
