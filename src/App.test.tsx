import type { DragEndEvent } from '@dnd-kit/core'
import type { ComponentChildren } from 'preact'
import { render, screen, waitFor, within } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App'
import type { LogEntry } from './types'

const historyMocks = vi.hoisted(() => ({
  appendLogEntry: vi.fn().mockResolvedValue(undefined),
  buildLogEntry: (action: string) => ({ action })
}))

vi.mock('./utils/history', () => historyMocks)

const dndMocks = vi.hoisted(() => {
  const handlers: { onDragEnd: ((event: DragEndEvent) => void) | null } = { onDragEnd: null }
  const DndContext = ({
    children,
    onDragEnd
  }: {
    children?: ComponentChildren
    onDragEnd?: (event: DragEndEvent) => void
  }) => {
    handlers.onDragEnd = onDragEnd ?? null
    return <div data-testid='dnd-context'>{children}</div>
  }
  const SortableContext = ({ children }: { children?: ComponentChildren }) => (
    <div data-testid='sortable-context'>{children}</div>
  )
  return { handlers, DndContext, SortableContext }
})

vi.mock('./utils/dndKitPreact', () => ({
  DndContext: dndMocks.DndContext,
  SortableContext: dndMocks.SortableContext
}))

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

test('shows an error when submitting an empty timer name', async () => {
  render(<App />)
  const user = userEvent.setup()

  await user.click(screen.getByRole('button', { name: /add new timer/i }))
  const dialog = screen.getByRole('dialog')

  await user.click(within(dialog).getByRole('button', { name: /create/i }))

  expect(screen.getByText('Name is required.')).toBeInTheDocument()
})

test('shows an error when submitting a duplicate timer name', async () => {
  render(<App />)
  const user = userEvent.setup()

  await user.click(screen.getByRole('button', { name: /add new timer/i }))
  const dialog = screen.getByRole('dialog')
  const input = within(dialog).getByRole('textbox', { name: /timer name/i })

  await user.type(input, 'Timer 1')
  await user.click(within(dialog).getByRole('button', { name: /create/i }))

  expect(screen.getByText('Name already in use')).toBeInTheDocument()
})

test('clears the modal error when input becomes valid', async () => {
  render(<App />)
  const user = userEvent.setup()

  await user.click(screen.getByRole('button', { name: /add new timer/i }))
  const dialog = screen.getByRole('dialog')
  const input = within(dialog).getByRole('textbox', { name: /timer name/i })

  await user.click(within(dialog).getByRole('button', { name: /create/i }))
  expect(screen.getByText('Name is required.')).toBeInTheDocument()

  await user.type(input, 'Focus')
  expect(screen.queryByText('Name is required.')).toBeNull()
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

test('closes the history panel', async () => {
  render(<App />)
  const user = userEvent.setup()

  await user.click(screen.getByRole('button', { name: /history/i }))
  expect(screen.getByRole('heading', { name: /history/i })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /hide/i }))

  expect(screen.queryByRole('heading', { name: /history/i })).toBeNull()
  expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument()
})

test('toggles a timer between start and pause', async () => {
  render(<App />)
  const user = userEvent.setup()

  await user.click(screen.getByRole('button', { name: /start timer/i }))
  expect(screen.getByRole('button', { name: /pause timer/i })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /pause timer/i }))
  expect(screen.getByRole('button', { name: /start timer/i })).toBeInTheDocument()
})

test('reorders timers after a drag end event', async () => {
  localStorage.setItem('timershift:timers', JSON.stringify({
    timers: [
      { id: 1, label: 'Timer A', elapsed: 0, running: false },
      { id: 2, label: 'Timer B', elapsed: 0, running: false }
    ],
    savedAt: 123
  }))

  render(<App />)

  expect(dndMocks.handlers.onDragEnd).not.toBeNull()
  expect(screen.getAllByRole('button', { name: /edit timer name/i }).map((button) => button.textContent)).toEqual([
    'Timer A',
    'Timer B'
  ])

  dndMocks.handlers.onDragEnd?.({
    active: { id: 1 },
    over: { id: 2 }
  } as DragEndEvent)

  await waitFor(() => {
    expect(screen.getAllByRole('button', { name: /edit timer name/i }).map((button) => button.textContent)).toEqual([
      'Timer B',
      'Timer A'
    ])
  })
})

test('logs summary entries on beforeunload', () => {
  render(<App />)

  window.dispatchEvent(new Event('beforeunload'))

  const actions = historyMocks.appendLogEntry.mock.calls.map(
    ([entry]) => (entry as LogEntry).action
  )

  expect(actions).toContain('summary')
  expect(actions).toContain('app_exit')
})
