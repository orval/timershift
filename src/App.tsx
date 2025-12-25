import type { JSX } from 'preact'
import { Pause, Play, CirclePlus, RotateCcw, X } from 'lucide-preact'
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import './App.css'

type Timer = {
  id: number
  label: string
  elapsed: number
  running: boolean
}

const STORAGE_KEY = 'timershift:timers'
const MAX_LABEL_LENGTH = 30

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
  onRenameRequest: (timer: Timer) => void
}

const TimerCard = ({ timer, onToggle, onReset, onRemove, onRenameRequest }: TimerCardProps): JSX.Element => {
  return (
    <div class={`timer-card ${timer.running ? 'timer-card--running' : ''}`}>
      <div class='timer-body'>
        <div class='timer-info'>
          <p class='timer-display'>{formatTime(timer.elapsed)}</p>
          <button
            class='timer-label-btn'
            type='button'
            onClick={() => onRenameRequest(timer)}
            aria-label='Edit timer name'
          >
            {timer.label}
          </button>
        </div>
        <div class='timer-actions'>
          <button
            type='button'
            class={`action-btn ${timer.running ? 'action-btn--pause' : 'action-btn--play'}`}
            aria-label={timer.running ? 'Pause timer' : 'Start timer'}
            onClick={() => onToggle(timer.id)}
          >
            <span class='sr-only'>{timer.running ? 'Pause' : 'Start'}</span>
            {timer.running ? (
              <Pause class='icon' size={18} strokeWidth={2.2} aria-hidden='true' />
            ) : (
              <Play class='icon' size={18} strokeWidth={2.2} aria-hidden='true' />
            )}
          </button>
          <button type='button' class='ghost-btn reset-btn' onClick={() => onReset(timer.id)}>
            <RotateCcw class='icon' size={18} strokeWidth={2.2} aria-hidden='true' />
            <span class='sr-only'>Reset</span>
          </button>
          <button
            class='ghost-btn remove-btn'
            type='button'
            onClick={() => onRemove(timer.id)}
            aria-label='Remove timer'
          >
            <X class='icon' size={18} strokeWidth={2.2} aria-hidden='true' />
            <span class='sr-only'>Remove</span>
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'rename'>('add')
  const [modalLabel, setModalLabel] = useState('')
  const [modalTimerId, setModalTimerId] = useState<number | null>(null)
  const [modalError, setModalError] = useState('')
  const modalInputRef = useRef<HTMLInputElement | null>(null)

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
    document.body.classList.toggle('no-running', !hasRunningTimer)
  }, [hasRunningTimer])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ timers, savedAt: Date.now() }))
  }, [timers])

  useEffect(() => {
    if (!isModalOpen) return
    modalInputRef.current?.focus()
    modalInputRef.current?.select()
  }, [isModalOpen])

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

  const addTimer = (label: string): void => {
    const nextId = Date.now()
    const trimmed = label.trim().slice(0, MAX_LABEL_LENGTH)
    setTimers((prev) => [
      ...prev,
      {
        id: nextId,
        label: trimmed,
        elapsed: 0,
        running: true
      }
    ].map((timer) =>
      timer.id === nextId ? timer : { ...timer, running: false }
    ))
  }

  const renameTimer = (id: number, label: string): void => {
    const nextLabel = label.trim().slice(0, MAX_LABEL_LENGTH)
    setTimers((prev) =>
      prev.map((timer) => (timer.id === id ? { ...timer, label: nextLabel } : timer))
    )
  }

  const normalizeLabel = (label: string): string => label.trim().toLowerCase()

  const isDuplicateLabel = (label: string, excludeId: number | null = null): boolean => {
    const normalized = normalizeLabel(label)
    if (!normalized) return false
    return timers.some((timer) => timer.id !== excludeId && normalizeLabel(timer.label) === normalized)
  }

  const openAddModal = (): void => {
    setModalMode('add')
    setModalLabel('')
    setModalTimerId(null)
    setModalError('')
    setIsModalOpen(true)
  }

  const openRenameModal = (timer: Timer): void => {
    setModalMode('rename')
    setModalLabel(timer.label)
    setModalTimerId(timer.id)
    setModalError('')
    setIsModalOpen(true)
  }

  const closeModal = (): void => {
    setIsModalOpen(false)
    setModalTimerId(null)
  }

  const handleModalSubmit = (event: Event): void => {
    event.preventDefault()
    const trimmed = modalLabel.trim()
    if (!trimmed) {
      setModalError('Name is required.')
      return
    }

    const excludeId = modalMode === 'rename' ? modalTimerId : null
    if (isDuplicateLabel(trimmed, excludeId)) {
      setModalError('Name already in use')
      return
    }

    if (modalMode === 'add') {
      addTimer(trimmed)
    } else if (modalTimerId !== null) {
      renameTimer(modalTimerId, trimmed)
    }

    closeModal()
  }

  const handleModalInput = (event: Event): void => {
    const value = (event.target as HTMLInputElement).value
    setModalLabel(value)
    if (modalError && value.trim() && !isDuplicateLabel(value, modalTimerId)) {
      setModalError('')
    }
  }

  return (
    <>
      <main class='app-shell'>
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
                onRenameRequest={openRenameModal}
              />
            ))
          )}
        </section>

        <div class='add-timer'>
          <button class='primary' type='button' onClick={openAddModal}>
            <CirclePlus class='icon' size={18} strokeWidth={2.2} aria-hidden='true' />
            <span class='sr-only'>Add new timer</span>
          </button>
        </div>
      </main>

      {isModalOpen && (
        <div class='modal-backdrop' onClick={closeModal}>
          <div
            class='modal'
            role='dialog'
            aria-modal='true'
            aria-labelledby='timer-modal-title'
            onClick={(event) => event.stopPropagation()}
          >
            <form class='modal-form' onSubmit={handleModalSubmit}>
              <h2 class='modal-title' id='timer-modal-title'>
                {modalMode === 'add' ? 'New timer' : 'Rename timer'}
              </h2>
              <label class='modal-label' htmlFor='timer-name'>
                Timer name
              </label>
              <input
                id='timer-name'
                ref={modalInputRef}
                class='modal-input'
                type='text'
                value={modalLabel}
                onInput={handleModalInput}
                maxLength={MAX_LABEL_LENGTH}
                aria-invalid={modalError ? 'true' : 'false'}
              />
              {modalError && (
                <p class='modal-error' role='status'>
                  {modalError}
                </p>
              )}
              <div class='modal-actions'>
                <button class='modal-btn' type='button' onClick={closeModal}>
                  Cancel
                </button>
                <button class='modal-btn modal-btn--primary' type='submit'>
                  {modalMode === 'add' ? 'Create' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default App
