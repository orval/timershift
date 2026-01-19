import type { JSX } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import {
  ArrowLeftRight,
  Check,
  ChevronsUpDown,
  Copy,
  Pause,
  Play,
  RotateCcw,
  X
} from 'lucide-preact'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CASE_CATEGORIES, DEFAULT_CASE_CATEGORY, type CaseCategory, type Timer } from '../types'
import { formatTime } from '../utils/time'

type TimerCardProps = {
  timer: Timer
  onToggle: (id: number, allowMultiple: boolean) => void
  onReset: (id: number) => void
  onAdjustRequest: (timer: Timer) => void
  onTransferRequest: (timer: Timer) => void
  onRemove: (id: number) => void
  onRenameRequest: (timer: Timer) => void
  onCaseCategoryChange: (id: number, category: CaseCategory) => void
  isPausedHighlight: boolean
}

export const TimerCard = ({
  timer,
  onToggle,
  onReset,
  onAdjustRequest,
  onTransferRequest,
  onRemove,
  onRenameRequest,
  onCaseCategoryChange,
  isPausedHighlight
}: TimerCardProps): JSX.Element => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: timer.id
  })
  const dragHandleProps = { ...attributes, ...listeners } as JSX.HTMLAttributes<HTMLDivElement>
  const stopDrag: JSX.PointerEventHandler<HTMLElement> = (event) => {
    event.stopPropagation()
  }
  const [isAltDown, setIsAltDown] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const categoryPopoverRef = useRef<HTMLDivElement | null>(null)
  const copyResetRef = useRef<number | null>(null)
  const handleToggleClick: JSX.MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation()
    const allowMultiple = event.getModifierState('Alt')
    onToggle(timer.id, allowMultiple)
  }
  const handleCardClick: JSX.MouseEventHandler<HTMLDivElement> = (event) => {
    if (!(event.target instanceof Element)) return
    const interactiveTarget = event.target.closest(
      'button, input, textarea, select, option, [role="button"], [role="textbox"], [contenteditable="true"]'
    )
    const currentTarget = event.currentTarget as Element
    if (interactiveTarget && interactiveTarget !== currentTarget) {
      return
    }
    const allowMultiple = event.getModifierState('Alt')
    onToggle(timer.id, allowMultiple)
  }
  const handleRenameClick: JSX.MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation()
    onRenameRequest(timer)
  }
  const copyTimerLabel = async (): Promise<void> => {
    if (typeof navigator === 'undefined') return
    let didCopy = false
    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(timer.label)
          didCopy = true
        } catch {
          // Fall back when clipboard permissions are denied.
        }
      }
      if (!didCopy) {
        const textarea = document.createElement('textarea')
        textarea.value = timer.label
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        didCopy = document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      if (didCopy) {
        setIsCopied(true)
        if (copyResetRef.current !== null) window.clearTimeout(copyResetRef.current)
        copyResetRef.current = window.setTimeout(() => setIsCopied(false), 1400)
      }
    } catch {
      // Ignore clipboard errors silently.
    }
  }
  const handleCopyClick: JSX.MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation()
    void copyTimerLabel()
  }
  const handleCategoryToggle: JSX.MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation()
    setIsCategoryOpen((prev) => !prev)
  }
  const handleCategorySelect = (category: CaseCategory): void => {
    onCaseCategoryChange(timer.id, category)
    setIsCategoryOpen(false)
  }
  useEffect(() => {
    const updateModifierState = (event: KeyboardEvent): void => {
      setIsAltDown(event.getModifierState('Alt'))
    }
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Alt') updateModifierState(event)
    }
    const handleKeyUp = (event: KeyboardEvent): void => {
      if (event.key === 'Alt') updateModifierState(event)
    }
    const handleBlur = (): void => {
      setIsAltDown(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])
  useEffect(() => {
    return () => {
      if (copyResetRef.current !== null) {
        window.clearTimeout(copyResetRef.current)
      }
    }
  }, [])
  useEffect(() => {
    if (!isCategoryOpen) return
    const handlePointerDown = (event: PointerEvent): void => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (!categoryPopoverRef.current?.contains(target)) {
        setIsCategoryOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setIsCategoryOpen(false)
    }
    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isCategoryOpen])
  const shouldGlow = !timer.running && isAltDown
  const isPaused = !timer.running && isPausedHighlight
  const canTransfer = timer.elapsed >= 60
  const currentCategory = timer.caseCategory ?? DEFAULT_CASE_CATEGORY
  const trimmedNote = typeof timer.caseNote === 'string' ? timer.caseNote.trim() : ''
  const normalizedNote = trimmedNote ? trimmedNote.replace(/\s+/g, ' ') : ''
  const notePreview = normalizedNote ? normalizedNote.slice(0, 40) : ''
  const typeClass = `timer-card--type-${timer.type.toLowerCase()}`
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      class={`timer-card ${typeClass} ${timer.running ? 'timer-card--running' : ''} ${isPaused ? 'timer-card--paused' : ''} ${isDragging ? 'timer-card--dragging' : ''}`}
      onClick={handleCardClick}
      {...dragHandleProps}
    >
      <div class='timer-body'>
        <div class='timer-info'>
          <div class='timer-display-row'>
            <p class='timer-display'>{formatTime(timer.elapsed)}</p>
          </div>
          <div class='timer-label-row'>
            <button
              class='timer-label-btn'
              type='button'
              onClick={handleRenameClick}
              onPointerDown={stopDrag}
              aria-label='Edit timer details'
            >
              {timer.label}
            </button>
            {timer.type === 'Case' && (
              <div
                class='timer-category-popover-wrapper'
                ref={categoryPopoverRef}
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  class='timer-category-badge'
                  type='button'
                  aria-haspopup='listbox'
                  aria-expanded={isCategoryOpen ? 'true' : 'false'}
                  onClick={handleCategoryToggle}
                >
                  {currentCategory}
                </button>
                {isCategoryOpen && (
                  <div class='timer-category-popover' role='listbox' aria-label='Case category'>
                    {CASE_CATEGORIES.map((category) => {
                      const isActive = currentCategory === category
                      return (
                        <button
                          key={category}
                          class={`timer-category-option ${isActive ? 'timer-category-option--active' : ''}`}
                          type='button'
                          role='option'
                          aria-selected={isActive ? 'true' : 'false'}
                          onClick={() => handleCategorySelect(category)}
                        >
                          {category}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
            <button
              class={`timer-copy-btn ${isCopied ? 'timer-copy-btn--copied' : ''}`}
              type='button'
              onClick={handleCopyClick}
              onPointerDown={stopDrag}
              aria-label={isCopied ? 'Copied timer name' : 'Copy timer name'}
              title={isCopied ? 'Copied' : 'Copy name'}
            >
              {isCopied ? (
                <Check class='icon' size={12} strokeWidth={2.2} aria-hidden='true' />
              ) : (
                <Copy class='icon' size={12} strokeWidth={2.2} aria-hidden='true' />
              )}
            </button>
            {notePreview && (
              <span class='timer-note-preview' title={normalizedNote}>
                {notePreview}
              </span>
            )}
          </div>
        </div>
        <div class='timer-actions'>
          <button
            type='button'
            class={`action-btn ${timer.running ? 'action-btn--pause' : 'action-btn--play'} ${shouldGlow ? 'shift-glow' : ''}`}
            aria-label={timer.running ? 'Pause timer' : 'Start timer'}
            onClick={handleToggleClick}
            onPointerDown={stopDrag}
          >
            <span class='sr-only'>{timer.running ? 'Pause' : 'Start'}</span>
            {timer.running ? (
              <Pause class='icon' size={16} strokeWidth={2.2} aria-hidden='true' />
            ) : (
              <Play class='icon' size={16} strokeWidth={2.2} aria-hidden='true' />
            )}
          </button>
          <button
            type='button'
            class='ghost-btn reset-btn'
            onClick={() => onReset(timer.id)}
            onPointerDown={stopDrag}
          >
            <RotateCcw class='icon' size={16} strokeWidth={2.2} aria-hidden='true' />
            <span class='sr-only'>Reset</span>
          </button>
          <button
            type='button'
            class='ghost-btn transfer-btn'
            onClick={() => onTransferRequest(timer)}
            onPointerDown={stopDrag}
            aria-label='Move time'
            disabled={!canTransfer}
          >
            <ArrowLeftRight class='icon' size={16} strokeWidth={2.2} aria-hidden='true' />
            <span class='sr-only'>Move time</span>
          </button>
          <button
            type='button'
            class='ghost-btn adjust-btn'
            onClick={() => onAdjustRequest(timer)}
            onPointerDown={stopDrag}
            aria-label='Adjust time'
          >
            <ChevronsUpDown class='icon' size={16} strokeWidth={2.2} aria-hidden='true' />
            <span class='sr-only'>Adjust</span>
          </button>
          <button
            class='ghost-btn remove-btn'
            type='button'
            onClick={() => onRemove(timer.id)}
            onPointerDown={stopDrag}
            aria-label='Remove timer'
          >
            <X class='icon' size={16} strokeWidth={2.2} aria-hidden='true' />
            <span class='sr-only'>Remove</span>
          </button>
        </div>
      </div>
    </div>
  )
}
