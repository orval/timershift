import type { JSX } from 'preact'
import { useEffect, useMemo, useState } from 'preact/hooks'
import './App.css'

type Timer = {
  id: number
  label: string
  elapsed: number
  running: boolean
}

const STORAGE_KEY = 'timershift:timers'

const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const hh = String(hours).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
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
        <p class='timer-display'>{formatTime(timer.elapsed)}</p>
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
  const [timers, setTimers] = useState<Timer[]>(() => {
    if (typeof window === 'undefined') {
      return []
    }

    const savedRaw = window.localStorage.getItem(STORAGE_KEY)
    if (savedRaw) {
      try {
        const parsed = JSON.parse(savedRaw) as { timers?: Timer[], savedAt?: number }
        const restored = (parsed.timers ?? []).map((timer) => ({ ...timer, running: false }))
        if (restored.length > 0) return restored
      } catch {
        // If parsing fails, fall back to defaults below.
      }
    }

    return [
      { id: 1, label: 'Timer 1', elapsed: 0, running: false },
    ]
  })

  const hasRunningTimer = useMemo(
    () => timers.some((timer) => timer.running),
    [timers]
  )

  useEffect(() => {
    if (!hasRunningTimer) return

    const interval = window.setInterval(() => {
      setTimers((prev) =>
        prev.map((timer) =>
          timer.running ? { ...timer, elapsed: timer.elapsed + 1 } : timer
        )
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [hasRunningTimer])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ timers, savedAt: Date.now() }))
  }, [timers])

  const toggleTimer = (id: number): void => {
    setTimers((prev) =>
      prev.map((timer) =>
        timer.id === id ? { ...timer, running: !timer.running } : timer
      )
    )
  }

  const resetTimer = (id: number): void => {
    setTimers((prev) =>
      prev.map((timer) => (timer.id === id ? { ...timer, elapsed: 0, running: false } : timer))
    )
  }

  const removeTimer = (id: number): void => {
    setTimers((prev) => prev.filter((timer) => timer.id !== id))
  }

  const addTimer = (): void => {
    const nextId = Date.now()
    const count = timers.length + 1
    setTimers((prev) => [
      ...prev,
      {
        id: nextId,
        label: `Timer ${count}`,
        elapsed: 0,
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
