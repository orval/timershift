import type { JSX } from 'preact'
import { CirclePlus, History } from 'lucide-preact'
import { closestCenter, type DragEndEvent, KeyboardSensor, MouseSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useEffect, useRef, useState } from 'preact/hooks'
import './App.css'
import { HistoryPanel } from './components/HistoryPanel'
import { TimerCard } from './components/TimerCard'
import { TimerModal } from './components/TimerModal'
import { MAX_LABEL_LENGTH } from './constants'
import { useTimers } from './hooks/useTimers'
import type { Timer } from './types'
import { DndContext, SortableContext } from './utils/dndKitPreact'
import { appendLogEntry, buildLogEntry } from './utils/history'
import { formatTime } from './utils/time'

function App (): JSX.Element {
  const {
    timers,
    displayTimers,
    removedTimers,
    hasRunningTimer,
    toggleTimer,
    resetTimer,
    removeTimer,
    addTimer,
    renameTimer,
    restoreTimer,
    reorderTimers,
    isDuplicateLabel
  } = useTimers()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'rename'>('add')
  const [modalLabel, setModalLabel] = useState('')
  const [modalTimerId, setModalTimerId] = useState<number | null>(null)
  const [modalError, setModalError] = useState('')
  const modalInputRef = useRef<HTMLInputElement | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const pointerSensor = typeof window !== 'undefined' && 'PointerEvent' in window ? PointerSensor : MouseSensor
  const sensors = useSensors(
    useSensor(pointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

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

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const sourceId = typeof active.id === 'number' ? active.id : Number(active.id)
    const targetId = typeof over.id === 'number' ? over.id : Number(over.id)
    if (Number.isNaN(sourceId) || Number.isNaN(targetId)) return
    reorderTimers(sourceId, targetId)
  }

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
                    onReset={resetTimer}
                    onRemove={removeTimer}
                    onRenameRequest={openRenameModal}
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
              <CirclePlus class='icon' size={18} strokeWidth={2.2} aria-hidden='true' />
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
                <History class='icon' size={18} strokeWidth={2.2} aria-hidden='true' />
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
    </>
  )
}

export default App
