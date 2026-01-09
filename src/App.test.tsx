import type { DragEndEvent } from '@dnd-kit/core'
import type { ComponentChildren } from 'preact'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App'
import { TimerAdjustModal } from './components/TimerAdjustModal'
import { TimerTransferModal } from './components/TimerTransferModal'
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

const seedTimers = (timers: Array<{ id: number, label: string, elapsed: number, running: boolean }>): void => {
  localStorage.setItem('timershift:timers', JSON.stringify({
    timers,
    savedAt: 123
  }))
}

test('renders the empty state when no timers exist', () => {
  render(<App />)
  expect(screen.getByText(/no timers yet/i)).toBeInTheDocument()
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
  seedTimers([{ id: 1, label: 'Timer 1', elapsed: 0, running: false }])
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
  seedTimers([{ id: 1, label: 'Timer 1', elapsed: 0, running: false }])
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

test('copies a timer label', async () => {
  seedTimers([{ id: 1, label: 'Timer 1', elapsed: 0, running: false }])
  render(<App />)
  const user = userEvent.setup()

  await user.click(screen.getByRole('button', { name: /copy timer name/i }))

  expect(await screen.findByRole('button', { name: /copied timer name/i })).toBeInTheDocument()
})

test('resets a timer', async () => {
  seedTimers([{ id: 1, label: 'Timer 1', elapsed: 5, running: false }])

  render(<App />)
  const user = userEvent.setup()

  expect(screen.getAllByText('00:00:05').length).toBeGreaterThan(0)

  await user.click(screen.getByRole('button', { name: /reset/i }))

  expect(screen.queryByText('00:00:05')).toBeNull()
  expect(screen.getAllByText('00:00:00').length).toBeGreaterThan(0)
})

test('undoes a reset from the toast', async () => {
  seedTimers([{ id: 1, label: 'Focus', elapsed: 42, running: false }])

  render(<App />)
  const user = userEvent.setup()

  expect(screen.getAllByText('00:00:42').length).toBeGreaterThan(0)

  await user.click(screen.getByRole('button', { name: /reset/i }))

  expect(screen.getByText('Reset "Focus" at 00:00:42')).toBeInTheDocument()
  expect(screen.queryByText('00:00:42')).toBeNull()
  expect(screen.getAllByText('00:00:00').length).toBeGreaterThan(0)

  await user.click(screen.getByRole('button', { name: /undo/i }))

  expect(screen.getAllByText('00:00:42').length).toBeGreaterThan(0)
  expect(screen.queryByText('Reset "Focus" at 00:00:42')).toBeNull()
})

test('dismisses a toast without undoing the reset', async () => {
  seedTimers([{ id: 1, label: 'Focus', elapsed: 42, running: false }])

  render(<App />)
  const user = userEvent.setup()

  await user.click(screen.getByRole('button', { name: /reset/i }))

  expect(screen.getByText('Reset "Focus" at 00:00:42')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /dismiss/i }))

  expect(screen.queryByText('Reset "Focus" at 00:00:42')).toBeNull()
  expect(screen.queryByText('00:00:42')).toBeNull()
  expect(screen.getAllByText('00:00:00').length).toBeGreaterThan(0)
})

test('plays the alert sound when a running timer crosses 15 minutes', async () => {
  seedTimers([{ id: 1, label: 'Focus', elapsed: 899, running: false }])

  const play = vi.fn().mockResolvedValue(undefined)
  class MockAudio {
    preload = ''
    currentTime = 0
    play = play
    constructor (public src: string) {}
  }

  vi.stubGlobal('Audio', MockAudio as unknown as typeof Audio)

  try {
    render(<App />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /start timer/i }))

    await waitFor(() => {
      expect(play).toHaveBeenCalled()
    }, { timeout: 2000 })
  } finally {
    vi.unstubAllGlobals()
  }
})

test('adjusts a timer by minutes', async () => {
  seedTimers([{ id: 1, label: 'Timer 1', elapsed: 60, running: false }])

  render(<App />)
  const user = userEvent.setup()

  expect(screen.getAllByText('00:01:00').length).toBeGreaterThan(0)

  await user.click(screen.getByRole('button', { name: /adjust time/i }))
  await user.click(screen.getByRole('button', { name: '+1 min' }))
  await user.click(screen.getByRole('button', { name: /apply/i }))

  expect(screen.getAllByText('00:02:00').length).toBeGreaterThan(0)
})

test('adjust range input updates the selected minutes', () => {
  const handleChange = vi.fn()

  render(
    <TimerAdjustModal
      label='Timer 1'
      minutes={0}
      maxMinutes={30}
      minMinutes={-30}
      onChange={handleChange}
      onClose={() => undefined}
      onSubmit={(event) => event.preventDefault()}
    />
  )

  const slider = screen.getByRole('slider', { name: /minutes to adjust/i })
  fireEvent.input(slider, { target: { value: '10' } })
  expect(handleChange).toHaveBeenCalledWith(10)
})

test('transfer range input updates the selected minutes', () => {
  const handleChange = vi.fn()

  render(
    <TimerTransferModal
      source={{ id: 1, label: 'Source', elapsed: 420, running: false }}
      targets={[]}
      minutes={0}
      maxMinutes={7}
      onMinutesChange={handleChange}
      onClose={() => undefined}
      onTransfer={() => undefined}
    />
  )

  const slider = screen.getByRole('slider', { name: /minutes to move/i })
  fireEvent.input(slider, { target: { value: '9' } })
  expect(handleChange).toHaveBeenCalledWith(7)
})

test('selects the all preset in transfer modal', async () => {
  const handleChange = vi.fn()
  const user = userEvent.setup()

  render(
    <TimerTransferModal
      source={{ id: 1, label: 'Source', elapsed: 420, running: false }}
      targets={[]}
      minutes={0}
      maxMinutes={7}
      onMinutesChange={handleChange}
      onClose={() => undefined}
      onTransfer={() => undefined}
    />
  )

  await user.click(screen.getByRole('button', { name: 'All' }))

  expect(handleChange).toHaveBeenCalledWith(7)
})

test('moves time between timers', async () => {
  seedTimers([
    { id: 1, label: 'Focus', elapsed: 600, running: false },
    { id: 2, label: 'Break', elapsed: 0, running: false }
  ])

  render(<App />)
  const user = userEvent.setup()

  await user.click(screen.getAllByRole('button', { name: /move time/i })[0])
  await user.click(screen.getByRole('button', { name: /5 min/i }))
  await user.click(screen.getByRole('button', { name: /break/i }))

  expect(screen.queryByRole('dialog', { name: /move time/i })).toBeNull()

  const focusCard = screen.getByText('Focus', { selector: 'button' }).closest('.timer-card')
  const breakCard = screen.getByText('Break', { selector: 'button' }).closest('.timer-card')

  expect(focusCard).not.toBeNull()
  expect(breakCard).not.toBeNull()
  if (!(focusCard instanceof HTMLElement) || !(breakCard instanceof HTMLElement)) return

  expect(within(focusCard).getByText('00:05:00')).toBeInTheDocument()
  expect(within(breakCard).getByText('00:05:00')).toBeInTheDocument()
  expect(within(breakCard).queryByText('00:00:00')).toBeNull()
})

test('removes a timer', async () => {
  seedTimers([{ id: 1, label: 'Timer 1', elapsed: 0, running: false }])
  render(<App />)
  const user = userEvent.setup()

  await user.click(screen.getByRole('button', { name: /remove timer/i }))

  expect(screen.getByText(/no timers yet/i)).toBeInTheDocument()
})

test('restores a timer from history', async () => {
  seedTimers([{ id: 1, label: 'Timer 1', elapsed: 0, running: false }])
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
  seedTimers([{ id: 1, label: 'Timer 1', elapsed: 0, running: false }])
  render(<App />)
  const user = userEvent.setup()

  await user.click(screen.getByRole('button', { name: /start timer/i }))
  expect(screen.getByRole('button', { name: /pause timer/i })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /pause timer/i }))
  expect(screen.getByRole('button', { name: /start timer/i })).toBeInTheDocument()
})

test('toggles play/pause when clicking on the middle of the timer card', async () => {
  seedTimers([{ id: 1, label: 'Timer 1', elapsed: 60, running: false }])
  render(<App />)
  const user = userEvent.setup()

  // Find the timer card and its display area
  const timerCard = screen.getByText('Timer 1', { selector: 'button' }).closest('.timer-card')
  expect(timerCard).not.toBeNull()
  if (!(timerCard instanceof HTMLElement)) return

  const timerDisplay = within(timerCard).getByText('00:01:00')
  
  // Initially should be stopped
  expect(screen.getByRole('button', { name: /start timer/i })).toBeInTheDocument()

  // Click on the timer display to start
  await user.click(timerDisplay)
  expect(screen.getByRole('button', { name: /pause timer/i })).toBeInTheDocument()

  // Click on the timer display again to pause
  await user.click(timerDisplay)
  expect(screen.getByRole('button', { name: /start timer/i })).toBeInTheDocument()
})

test('starting a timer pauses other running timers', async () => {
  seedTimers([
    { id: 1, label: 'Timer A', elapsed: 0, running: false },
    { id: 2, label: 'Timer B', elapsed: 0, running: false }
  ])
  render(<App />)
  const user = userEvent.setup()

  const timerACard = screen.getByText('Timer A', { selector: 'button' }).closest('.timer-card')
  const timerBCard = screen.getByText('Timer B', { selector: 'button' }).closest('.timer-card')

  expect(timerACard).not.toBeNull()
  expect(timerBCard).not.toBeNull()
  if (!(timerACard instanceof HTMLElement) || !(timerBCard instanceof HTMLElement)) return

  expect(within(timerBCard).getByRole('button', { name: /start timer/i })).toBeInTheDocument()

  await user.click(within(timerACard).getByRole('button', { name: /start timer/i }))
  expect(within(timerACard).getByRole('button', { name: /pause timer/i })).toBeInTheDocument()

  await user.click(within(timerBCard).getByRole('button', { name: /start timer/i }))

  expect(within(timerBCard).getByRole('button', { name: /pause timer/i })).toBeInTheDocument()
  expect(within(timerACard).getByRole('button', { name: /start timer/i })).toBeInTheDocument()
})

test('reorders timers after a drag end event', async () => {
  seedTimers([
    { id: 1, label: 'Timer A', elapsed: 0, running: false },
    { id: 2, label: 'Timer B', elapsed: 0, running: false }
  ])

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
