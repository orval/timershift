import type { JSX } from 'preact'
import { CirclePlus, History, Moon, Sun } from 'lucide-preact'
import { closestCenter, type DragEndEvent, KeyboardSensor, MouseSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { invoke } from '@tauri-apps/api/core'
import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { HistoryPanel } from './components/HistoryPanel'
import { TimerCard } from './components/TimerCard'
import { TimerAdjustModal } from './components/TimerAdjustModal'
import { TimerModal } from './components/TimerModal'
import { TimerTransferModal } from './components/TimerTransferModal'
import { MAX_LABEL_LENGTH } from './constants'
import { useTimers } from './hooks/useTimers'
import { DEFAULT_CASE_CATEGORY, type CaseCategory, type Timer, type TimerType } from './types'
import { DndContext, SortableContext } from './utils/dndKitPreact'
import { appendLogEntry, buildLogEntry } from './utils/history'
import { formatStatusMins, formatTime } from './utils/time'
import { applyTheme, getInitialTheme, THEME_STORAGE_KEY, type ThemeName } from './utils/theme'
import alertSoundUrl from './assets/alert.m4r'

const ALERT_THRESHOLD_SECONDS = 15 * 60
const ALERT_SOUND_SRC = alertSoundUrl
const DEFAULT_NEW_TIMER_TYPE: TimerType = 'Other'

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
    setTimerType,
    setCaseCategory,
    setCaseNote,
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
  const [theme, setTheme] = useState<ThemeName>(getInitialTheme)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'rename'>('add')
  const [modalLabel, setModalLabel] = useState('')
  const [modalType, setModalType] = useState<TimerType>(DEFAULT_NEW_TIMER_TYPE)
  const [modalCaseCategory, setModalCaseCategory] = useState<CaseCategory>(DEFAULT_CASE_CATEGORY)
  const [modalCaseNote, setModalCaseNote] = useState('')
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
  const alertAudioRef = useRef<HTMLAudioElement | null>(null)
  const lastElapsedByIdRef = useRef<Map<number, number>>(new Map())

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
  const isValidCaseLabel = (label: string): boolean => /^\d{8}$/.test(label)
  const getAutoTimerType = (label: string): TimerType => (
    isValidCaseLabel(label) ? 'Case' : 'Other'
  )
  const getLabelError = (label: string, type: TimerType, excludeId: number | null): string => {
    if (!label) return type === 'Case' ? 'Case ID is required.' : 'Name is required.'
    if (type === 'Case' && !isValidCaseLabel(label)) return 'Case ID must be 8 digits.'
    if (isDuplicateLabel(label, excludeId)) {
      return type === 'Case' ? 'Case ID already in use.' : 'Name already in use'
    }
    return ''
  }

  const playAlertSound = useCallback((): void => {
    if (typeof Audio === 'undefined') return
    if (!alertAudioRef.current) {
      const audio = new Audio(ALERT_SOUND_SRC)
      audio.preload = 'auto'
      alertAudioRef.current = audio
    }
    const audio = alertAudioRef.current
    if (!audio) return
    audio.currentTime = 0
    const playResult = audio.play()
    if (typeof playResult?.catch === 'function') {
      playResult.catch(() => {})
    }
  }, [])

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
    applyTheme(theme)
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Ignore storage failures (private mode or disabled storage).
    }
  }, [theme])

  useEffect(() => {
    if (!isTauri) return
    void invoke('set_tray_title', { title: trayTitle })
  }, [isTauri, trayTitle])

  useEffect(() => {
    if (!isTauri) return
    void invoke('set_tray_icon_state', { state: trayIconState })
  }, [isTauri, trayIconState])

  useEffect(() => {
    if (timers.length === 0) {
      lastElapsedByIdRef.current.clear()
      return
    }

    const lastElapsedById = lastElapsedByIdRef.current
    const activeIds = new Set<number>()
    let shouldPlay = false

    timers.forEach((timer) => {
      activeIds.add(timer.id)
      const previousElapsed = lastElapsedById.get(timer.id)
      if (
        timer.running &&
        previousElapsed !== undefined &&
        previousElapsed < ALERT_THRESHOLD_SECONDS &&
        timer.elapsed >= ALERT_THRESHOLD_SECONDS
      ) {
        shouldPlay = true
      }
      lastElapsedById.set(timer.id, timer.elapsed)
    })

    for (const id of lastElapsedById.keys()) {
      if (!activeIds.has(id)) {
        lastElapsedById.delete(id)
      }
    }

    if (shouldPlay) {
      playAlertSound()
    }
  }, [playAlertSound, timers])

  const openAddModal = (): void => {
    setModalMode('add')
    setModalLabel('')
    setModalType(DEFAULT_NEW_TIMER_TYPE)
    setModalCaseCategory(DEFAULT_CASE_CATEGORY)
    setModalCaseNote('')
    setModalTimerId(null)
    setModalError('')
    setIsModalOpen(true)
  }

  const openRenameModal = (timer: Timer): void => {
    setModalMode('rename')
    setModalLabel(timer.label)
    setModalType(timer.type)
    setModalCaseCategory(timer.caseCategory ?? DEFAULT_CASE_CATEGORY)
    setModalCaseNote(timer.caseNote ?? '')
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
    const resolvedType = modalMode === 'add' ? getAutoTimerType(trimmed) : modalType
    const excludeId = modalMode === 'rename' ? modalTimerId : null
    const error = getLabelError(trimmed, resolvedType, excludeId)
    if (error) {
      setModalError(error)
      return
    }

    if (modalMode === 'add') {
      addTimer(trimmed, resolvedType)
    } else if (modalTimerId !== null) {
      setTimerType(modalTimerId, modalType)
      if (modalType === 'Case') {
        setCaseCategory(modalTimerId, modalCaseCategory)
      }
      setCaseNote(modalTimerId, modalCaseNote)
      renameTimer(modalTimerId, trimmed)
    }

    closeModal()
  }

  const handleModalInput = (event: Event): void => {
    const value = (event.target as HTMLInputElement).value
    setModalLabel(value)
    const trimmedValue = value.trim()
    const nextType = modalMode === 'add' ? getAutoTimerType(trimmedValue) : modalType
    if (modalMode === 'add' && nextType !== modalType) {
      setModalType(nextType)
    }
    if (!modalError) return
    const excludeId = modalMode === 'rename' ? modalTimerId : null
    const error = getLabelError(trimmedValue, nextType, excludeId)
    setModalError(error)
  }

  const handleModalTypeChange = (nextType: TimerType): void => {
    setModalType(nextType)
    if (!modalError) return
    const excludeId = modalMode === 'rename' ? modalTimerId : null
    const error = getLabelError(modalLabel.trim(), nextType, excludeId)
    setModalError(error)
  }

  const handleModalCaseCategoryChange = (category: CaseCategory): void => {
    setModalCaseCategory(category)
  }

  const handleModalCaseNoteChange = (note: string): void => {
    setModalCaseNote(note)
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
  const adjustMinMinutes = adjustTimer
    ? -Math.min(60, Math.floor(adjustTimer.elapsed / 60))
    : 0
  const transferSource = transferSourceId !== null
    ? timers.find((timer) => timer.id === transferSourceId)
    : null
  const transferTargets = transferSource
    ? timers.filter((timer) => timer.id !== transferSource.id)
    : []
  const transferMaxMinutes = transferSource
    ? Math.floor(transferSource.elapsed / 60)
    : 0
  const isLightTheme = theme === 'light'
  const nextTheme = isLightTheme ? 'dark' : 'light'
  const themeLabel = nextTheme === 'light' ? 'Switch to light mode' : 'Switch to dark mode'
  const viewportBgClass = hasRunningTimer ? 'bg-app-bg' : 'bg-app-bg-no-running'
  const dockBgClass = hasRunningTimer ? 'bg-app-gradient' : 'bg-app-bg-no-running'

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-0 top-[var(--titlebar-offset)] overflow-y-auto overscroll-contain ${viewportBgClass}`}
      >
        {displayTimers.length > 0 && (
          <section
            className={`sticky top-0 z-[6] border-b border-white-mid p-xs shadow-dock ${dockBgClass}`}
          >
            <div className='mx-auto flex w-full max-w-[960px] flex-wrap items-center justify-center gap-lg'>
              {displayTimers.map((timer) => (
                <div className='flex flex-col items-center gap-xs' key={timer.id}>
                  <p className='m-0 text-display font-semibold tabular-nums tracking-wider text-text-bright [text-shadow:0_0_var(--space-xl)_var(--text-glow-30)]'>
                    {formatTime(timer.elapsed)}
                  </p>
                  <p className='m-0 max-w-[220px] truncate text-md font-semibold tracking-[0.02em] text-text-muted'>
                    {timer.label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
        <main className='mx-auto flex max-w-[960px] flex-col gap-lg px-xs pb-xl pt-xs'>
          <section className='flex flex-col gap-0.5'>
            {timers.length === 0 ? (
              <p className='my-lg rounded-lg border border-dashed border-border-default bg-white-low p-xl text-center text-text-muted'>
                No timers yet. Create one to get started.
              </p>
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
                      onCaseCategoryChange={setCaseCategory}
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

          <div className='grid grid-cols-[1fr_auto_1fr] items-center'>
            <div className='flex justify-start'>
              <button
                className='inline-flex size-btn items-center justify-center rounded-md border border-white-high bg-white-low p-0 text-text-icon-muted shadow-base transition-[transform,box-shadow,background,color] duration-150 hover:bg-white-mid hover:text-text-default active:translate-y-px'
                type='button'
                onClick={() => setTheme(nextTheme)}
                aria-pressed={isLightTheme}
              >
                {nextTheme === 'light' ? (
                  <Sun size={16} strokeWidth={2.2} aria-hidden='true' />
                ) : (
                  <Moon size={16} strokeWidth={2.2} aria-hidden='true' />
                )}
                <span className='sr-only'>{themeLabel}</span>
              </button>
            </div>
            <div className='flex justify-center'>
              <button
                className='inline-flex size-btn items-center justify-center rounded-md border border-white-high bg-white-low p-0 text-text-default shadow-base transition-[transform,box-shadow,background,color] duration-150 hover:bg-white-mid hover:text-text-bright hover:shadow-button-hover active:translate-y-px'
                type='button'
                onClick={openAddModal}
              >
                <CirclePlus size={16} strokeWidth={2.2} aria-hidden='true' />
                <span className='sr-only'>Add new timer</span>
              </button>
            </div>
            <div className='flex justify-end'>
              {!isHistoryOpen && (
                <button
                  className='inline-flex size-btn items-center justify-center rounded-md border border-white-high bg-white-low p-0 text-text-icon-muted shadow-base transition-[transform,box-shadow,background,color] duration-150 hover:bg-white-mid hover:text-text-default active:translate-y-px'
                  type='button'
                  onClick={() => setIsHistoryOpen(true)}
                  aria-label='History'
                >
                  <History size={16} strokeWidth={2.2} aria-hidden='true' />
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {isModalOpen && (
        <TimerModal
          mode={modalMode}
          label={modalLabel}
          error={modalError}
          maxLabelLength={MAX_LABEL_LENGTH}
          timerType={modalType}
          onTypeChange={modalMode === 'rename' ? handleModalTypeChange : undefined}
          caseCategory={modalMode === 'rename' ? modalCaseCategory : undefined}
          caseNote={modalMode === 'rename' ? modalCaseNote : undefined}
          onCaseCategoryChange={modalMode === 'rename' ? handleModalCaseCategoryChange : undefined}
          onCaseNoteChange={modalMode === 'rename' ? handleModalCaseNoteChange : undefined}
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
          minMinutes={adjustMinMinutes}
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
        <div
          className='fixed bottom-xl right-xl z-[60] inline-flex animate-toast-in items-center gap-lg rounded-md border border-border-subtle bg-toast-bg p-sm shadow-toast'
          role='status'
          aria-live='polite'
        >
          <p className='m-0 text-sm font-semibold text-text-soft'>{toast.message}</p>
          {toast.onAction && toast.actionLabel && (
            <button
              className='rounded-md border border-accent/60 bg-accent/[0.22] px-[60px] py-xs text-md font-bold text-text-soft transition-[background,color] duration-150 hover:bg-accent/30 active:translate-y-px'
              type='button'
              onClick={toast.onAction}
            >
              {toast.actionLabel}
            </button>
          )}
          <button
            className='rounded-md border border-white-high bg-white-mid px-sm py-xs text-sm font-bold text-text-soft transition-[background,color] duration-150 hover:bg-white-high active:translate-y-px'
            type='button'
            onClick={() => setToast(null)}
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  )
}

export default App
