import type { JSX } from 'preact'
import { useEffect, useMemo, useState } from 'preact/hooks'
import './App.css'

type Timer = {
  id: number
  label: string
  duration: number
  remaining: number
  running: boolean
}

const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

type TimerCardProps = {
  timer: Timer
  onToggle: (id: number) => void
  onReset: (id: number) => void
  onRemove: (id: number) => void
}

const TimerCard = ({ timer, onToggle, onReset, onRemove }: TimerCardProps): JSX.Element => {
  return (
    <div class={`timer-card ${timer.running ? 'timer-card--running' : ''}`}>
      <div class='timer-heading'>
        <p class='timer-label'>{timer.label}</p>
        <button class='ghost-btn' type='button' onClick={() => onRemove(timer.id)}>
          Remove
        </button>
      </div>
      <div class='timer-body'>
        <p class='timer-display'>{formatTime(timer.remaining)}</p>
        <div class='timer-actions'>
          <button type='button' onClick={() => onToggle(timer.id)}>
            {timer.running ? 'Pause' : 'Start'}
          </button>
          <button type='button' class='ghost-btn' onClick={() => onReset(timer.id)}>
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}

function App (): JSX.Element {
  const [timers, setTimers] = useState<Timer[]>([
    { id: 1, label: 'Focus sprint', duration: 25 * 60, remaining: 25 * 60, running: false },
    { id: 2, label: 'Break', duration: 5 * 60, remaining: 5 * 60, running: false },
    { id: 3, label: 'Stretch', duration: 10 * 60, remaining: 10 * 60, running: false }
  ])

  const hasRunningTimer = useMemo(
    () => timers.some((timer) => timer.running && timer.remaining > 0),
    [timers]
  )

  useEffect(() => {
    if (!hasRunningTimer) return

    const interval = window.setInterval(() => {
      setTimers((prev) =>
        prev.map((timer) => {
          if (!timer.running || timer.remaining === 0) return timer
          const next = Math.max(0, timer.remaining - 1)
          return { ...timer, remaining: next, running: next > 0 }
        })
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [hasRunningTimer])

  const toggleTimer = (id: number): void => {
    setTimers((prev) =>
      prev.map((timer) =>
        timer.id === id && timer.remaining > 0
          ? { ...timer, running: !timer.running }
          : timer
      )
    )
  }

  const resetTimer = (id: number): void => {
    setTimers((prev) =>
      prev.map((timer) =>
        timer.id === id ? { ...timer, remaining: timer.duration, running: false } : timer
      )
    )
  }

  const removeTimer = (id: number): void => {
    setTimers((prev) => prev.filter((timer) => timer.id !== id))
  }

  const addTimer = (): void => {
    const defaultDuration = 5 * 60
    const nextId = Date.now()
    const count = timers.length + 1
    setTimers((prev) => [
      ...prev,
      {
        id: nextId,
        label: `Timer ${count}`,
        duration: defaultDuration,
        remaining: defaultDuration,
        running: false
      }
    ])
  }

  return (
    <div class='app-shell'>
      <header class='page-header'>
        <button class='primary' type='button' onClick={addTimer} title='Add new timer'>
          +
        </button>
      </header>

      <section class='timers'>
        {timers.length === 0 ? (
          <p class='empty'>No timers yet. Create one to get started.</p>
        ) : (
          timers.map((timer) => (
            <TimerCard
              key={timer.id}
              timer={timer}
              onToggle={toggleTimer}
              onReset={resetTimer}
              onRemove={removeTimer}
            />
          ))
        )}
      </section>
    </div>
  )
}

export default App
