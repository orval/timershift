import { render, screen } from '@testing-library/preact'
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
