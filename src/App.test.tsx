import { render, screen, within } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test } from 'vitest'
import App from './App'

afterEach(() => {
  localStorage.clear()
})

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

test('renames a timer from the modal', async () => {
  render(<App />)
  const user = userEvent.setup()

  await user.click(screen.getByRole('button', { name: /edit timer name/i }))
  const dialog = screen.getByRole('dialog')
  const input = within(dialog).getByRole('textbox', { name: /timer name/i })

  await user.clear(input)
  await user.type(input, 'Deep Work')
  await user.click(within(dialog).getByRole('button', { name: /save/i }))

  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByText('Deep Work', { selector: 'button' })).toBeInTheDocument()
})

test('resets a timer', async () => {
  localStorage.setItem('timershift:timers', JSON.stringify({
    timers: [{ id: 1, label: 'Timer 1', elapsed: 5, running: false }],
    savedAt: 123
  }))

  render(<App />)
  const user = userEvent.setup()

  expect(screen.getAllByText('00:00:05').length).toBeGreaterThan(0)

  await user.click(screen.getByRole('button', { name: /reset/i }))

  expect(screen.queryByText('00:00:05')).toBeNull()
  expect(screen.getAllByText('00:00:00').length).toBeGreaterThan(0)
})

test('removes a timer', async () => {
  render(<App />)
  const user = userEvent.setup()

  await user.click(screen.getByRole('button', { name: /remove timer/i }))

  expect(screen.getByText(/no timers yet/i)).toBeInTheDocument()
})

test('restores a timer from history', async () => {
  render(<App />)
  const user = userEvent.setup()

  await user.click(screen.getByRole('button', { name: /remove timer/i }))
  expect(screen.getByText(/no timers yet/i)).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /history/i }))
  await user.click(screen.getByRole('button', { name: /restore/i }))

  expect(screen.getByText('Timer 1', { selector: 'button' })).toBeInTheDocument()
  expect(screen.getByText(/no removed timers yet/i)).toBeInTheDocument()
})
