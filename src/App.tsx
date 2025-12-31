import type { JSX } from 'preact'
import { CirclePlus, History } from 'lucide-preact'
import { closestCenter, type DragEndEvent, KeyboardSensor, MouseSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { invoke } from '@tauri-apps/api/core'
import { useEffect, useRef, useState } from 'preact/hooks'
import './App.css'
import { HistoryPanel } from './components/HistoryPanel'
import { TimerCard } from './components/TimerCard'
import { TimerAdjustModal } from './components/TimerAdjustModal'
import { TimerModal } from './components/TimerModal'
import { TimerTransferModal } from './components/TimerTransferModal'
import { MAX_LABEL_LENGTH } from './constants'
import { useTimers } from './hooks/useTimers'
import type { Timer } from './types'
import { DndContext, SortableContext } from './utils/dndKitPreact'
import { appendLogEntry, buildLogEntry } from './utils/history'
import { formatStatusMins, formatTime } from './utils/time'

function App (): JSX.Element {
  const {
    timers,
    displayTimers,
    removedTimers,
    hasRunningTimer,
    pausedDisplayTimerId,
    toggleTimer,
    resetTimer,
    restoreTimerSnapshot,
    removeTimer,
    adjustTimerMinutes,
    transferTimerMinutes,
    addTimer,
    renameTimer,
    restoreTimer,
    reorderTimers,
    isDuplicateLabel
  } = useTimers()
  const [toast, setToast] = useState<{
    id: number
    message: string
    actionLabel?: string
    onAction?: () => void
  } | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'rename'>('add')
  const [modalLabel, setModalLabel] = useState('')
  const [modalTimerId, setModalTimerId] = useState<number | null>(null)
  const [modalError, setModalError] = useState('')
  const modalInputRef = useRef<HTMLInputElement | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [adjustTimerId, setAdjustTimerId] = useState<number | null>(null)
  const [adjustMinutes, setAdjustMinutes] = useState(0)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [transferSourceId, setTransferSourceId] = useState<number | null>(null)
  const [transferMinutes, setTransferMinutes] = useState(0)

  const pointerSensor = typeof window !== 'undefined' && 'PointerEvent' in window ? PointerSensor : MouseSensor
  const sensors = useSensors(
    useSensor(pointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window
  const trayIconState = hasRunningTimer ? 'play' : 'pause'
  const trayTitle = displayTimers.length > 0
    ? `${displayTimers[0].label} ${formatStatusMins(displayTimers[0].elapsed)}`
    : ''

  useEffect(() => {
    document.body.classList.toggle('no-running', !hasRunningTimer)
  }, [hasRunningTimer])

  useEffect(() => {
    void appendLogEntry(buildLogEntry(isHistoryOpen ? 'history_open' : 'history_close'))
  }, [isHistoryOpen])

  useEffect(() => {
    if (!isModalOpen) return
    modalInputRef.current?.focus()
    modalInputRef.current?.select()
  }, [isModalOpen])

  useEffect(() => {
    if (!toast) return
    const timeoutId = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current))
    }, 8000)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  useEffect(() => {
    if (!isTauri) return
    void invoke('set_tray_title', { title: trayTitle })
  }, [isTauri, trayTitle])

  useEffect(() => {
    if (!isTauri) return
    void invoke('set_tray_icon_state', { state: trayIconState })
  }, [isTauri, trayIconState])

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

  const openAdjustModal = (timer: Timer): void => {
    setAdjustTimerId(timer.id)
    setAdjustMinutes(0)
    setIsAdjustOpen(true)
  }

  const closeAdjustModal = (): void => {
    setIsAdjustOpen(false)
    setAdjustTimerId(null)
  }

  const openTransferModal = (timer: Timer): void => {
    const maxMinutes = Math.floor(timer.elapsed / 60)
    setTransferSourceId(timer.id)
    setTransferMinutes(Math.min(5, maxMinutes))
    setIsTransferOpen(true)
  }

  const closeTransferModal = (): void => {
    setIsTransferOpen(false)
    setTransferSourceId(null)
    setTransferMinutes(0)
  }

  const handleAdjustSubmit = (event: Event): void => {
    event.preventDefault()
    if (adjustTimerId === null) return
    if (adjustMinutes !== 0) {
      adjustTimerMinutes(adjustTimerId, adjustMinutes)
    }
    closeAdjustModal()
  }

  const handleTransfer = (targetId: number): void => {
    if (transferSourceId === null) return
    if (transferMinutes <= 0) return
    const sourceTimer = timers.find((timer) => timer.id === transferSourceId)
    const targetTimer = timers.find((timer) => timer.id === targetId)
    if (!sourceTimer || !targetTimer) return
    const movedSeconds = Math.min(transferMinutes * 60, sourceTimer.elapsed)
    if (movedSeconds <= 0) return
    transferTimerMinutes(transferSourceId, targetId, transferMinutes)
    const toastId = Date.now()
    setToast({
      id: toastId,
      message: `Moved ${formatTime(movedSeconds)} from "${sourceTimer.label}" to "${targetTimer.label}".`
    })
    closeTransferModal()
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

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const sourceId = typeof active.id === 'number' ? active.id : Number(active.id)
    const targetId = typeof over.id === 'number' ? over.id : Number(over.id)
    if (Number.isNaN(sourceId) || Number.isNaN(targetId)) return
    reorderTimers(sourceId, targetId)
  }

  const handleReset = (id: number): void => {
    const snapshot = timers.find((timer) => timer.id === id)
    if (!snapshot) return
    resetTimer(id)
    const toastId = Date.now()
    setToast({
      id: toastId,
      message: `Reset "${snapshot.label}" at ${formatTime(snapshot.elapsed)}`,
      actionLabel: 'Undo',
      onAction: () => {
        restoreTimerSnapshot({ ...snapshot })
        setToast(null)
      }
    })
  }

  const adjustTimer = adjustTimerId !== null
    ? timers.find((timer) => timer.id === adjustTimerId)
    : null
  const transferSource = transferSourceId !== null
    ? timers.find((timer) => timer.id === transferSourceId)
    : null
  const transferTargets = transferSource
    ? timers.filter((timer) => timer.id !== transferSource.id)
    : []
  const transferMaxMinutes = transferSource
    ? Math.floor(transferSource.elapsed / 60)
    : 0

  return (
    <>
      <main class='app-shell'>
        <section class='timers'>
          {displayTimers.length > 0 && (
            <div class='current-timer-card'>
              <div class='current-timer-list'>
                {displayTimers.map((timer) => (
                  <div class='current-timer-item' key={timer.id}>
                    <p class='current-timer-display'>{formatTime(timer.elapsed)}</p>
                    <p class='current-timer-label'>{timer.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {timers.length === 0 ? (
            <p class='empty'>No timers yet. Create one to get started.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={timers.map((timer) => timer.id)} strategy={verticalListSortingStrategy}>
                {timers.map((timer) => (
                  <TimerCard
                    key={timer.id}
                    timer={timer}
                    onToggle={toggleTimer}
                    onReset={handleReset}
                    onRemove={removeTimer}
                    onAdjustRequest={openAdjustModal}
                    onTransferRequest={openTransferModal}
                    onRenameRequest={openRenameModal}
                    isPausedHighlight={timer.id === pausedDisplayTimerId}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </section>

        {isHistoryOpen && (
          <HistoryPanel
            removedTimers={removedTimers}
            onClose={() => setIsHistoryOpen(false)}
            onRestore={restoreTimer}
          />
        )}

        <div class='footer-actions'>
          <div class='footer-spacer' aria-hidden='true' />
          <div class='add-timer'>
            <button class='primary' type='button' onClick={openAddModal}>
              <CirclePlus class='icon' size={16} strokeWidth={2.2} aria-hidden='true' />
              <span class='sr-only'>Add new timer</span>
            </button>
          </div>
          <div class='history-toggle-right'>
            {!isHistoryOpen && (
              <button
                class='ghost-btn history-toggle-btn'
                type='button'
                onClick={() => setIsHistoryOpen(true)}
                aria-label='History'
              >
                <History class='icon' size={16} strokeWidth={2.2} aria-hidden='true' />
              </button>
            )}
          </div>
        </div>
      </main>

      {isModalOpen && (
        <TimerModal
          mode={modalMode}
          label={modalLabel}
          error={modalError}
          maxLabelLength={MAX_LABEL_LENGTH}
          inputRef={modalInputRef}
          onClose={closeModal}
          onSubmit={handleModalSubmit}
          onInput={handleModalInput}
        />
      )}

      {isAdjustOpen && adjustTimer && (
        <TimerAdjustModal
          label={adjustTimer.label}
          minutes={adjustMinutes}
          maxMinutes={60}
          onChange={setAdjustMinutes}
          onClose={closeAdjustModal}
          onSubmit={handleAdjustSubmit}
        />
      )}

      {isTransferOpen && transferSource && (
        <TimerTransferModal
          source={transferSource}
          targets={transferTargets}
          minutes={transferMinutes}
          maxMinutes={transferMaxMinutes}
          onMinutesChange={setTransferMinutes}
          onClose={closeTransferModal}
          onTransfer={handleTransfer}
        />
      )}

      {toast && (
        <div class='toast' role='status' aria-live='polite'>
          <p class='toast-message'>{toast.message}</p>
          {toast.onAction && toast.actionLabel && (
            <button class='toast-btn' type='button' onClick={toast.onAction}>
              {toast.actionLabel}
            </button>
          )}
          <button class='toast-dismiss' type='button' onClick={() => setToast(null)}>
            Dismiss
          </button>
        </div>
      )}
    </>
  )
}

export default App
