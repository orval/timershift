import type { JSX } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { ArrowLeftRight, Check, ChevronsUpDown, Copy, Pause, Play, RotateCcw, X } from 'lucide-preact'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Timer } from '../types'
import { formatTime } from '../utils/time'

type TimerCardProps = {
  timer: Timer
  onToggle: (id: number, allowMultiple: boolean) => void
  onReset: (id: number) => void
  onAdjustRequest: (timer: Timer) => void
  onTransferRequest: (timer: Timer) => void
  onRemove: (id: number) => void
  onRenameRequest: (timer: Timer) => void
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
  isPausedHighlight
}: TimerCardProps): JSX.Element => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: timer.id
  })
  const dragHandleProps = { ...attributes, ...listeners } as JSX.HTMLAttributes<HTMLDivElement>
  const stopDrag: JSX.PointerEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation()
  }
  const [isAltDown, setIsAltDown] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const copyResetRef = useRef<number | null>(null)
  const handleToggleClick: JSX.MouseEventHandler<HTMLButtonElement> = (event) => {
    const allowMultiple = event.getModifierState('Alt')
    onToggle(timer.id, allowMultiple)
  }
  const handleCardClick: JSX.MouseEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as HTMLElement
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return
    }
    const allowMultiple = event.getModifierState('Alt')
    onToggle(timer.id, allowMultiple)
  }
  const copyTimerLabel = async (): Promise<void> => {
    if (typeof navigator === 'undefined') return
    let didCopy = false
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(timer.label)
        didCopy = true
      } else {
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
  const handleCopyClick: JSX.MouseEventHandler<HTMLButtonElement> = () => {
    void copyTimerLabel()
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
  const shouldGlow = !timer.running && isAltDown
  const isPaused = !timer.running && isPausedHighlight
  const canTransfer = timer.elapsed >= 60
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      class={`timer-card ${timer.running ? 'timer-card--running' : ''} ${isPaused ? 'timer-card--paused' : ''} ${isDragging ? 'timer-card--dragging' : ''}`}
      {...dragHandleProps}
    >
      <div class='timer-body'>
        <div class='timer-info' onClick={handleCardClick}>
          <p class='timer-display'>{formatTime(timer.elapsed)}</p>
          <div class='timer-label-row'>
            <button
              class='timer-label-btn'
              type='button'
              onClick={() => onRenameRequest(timer)}
              onPointerDown={stopDrag}
              aria-label='Edit timer name'
            >
              {timer.label}
            </button>
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
