import type { JSX } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { Clock, Pause, Play, RotateCcw, X } from 'lucide-preact'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Timer } from '../types'
import { formatTime } from '../utils/time'

type TimerCardProps = {
  timer: Timer
  onToggle: (id: number, allowMultiple: boolean) => void
  onReset: (id: number) => void
  onAdjustRequest: (timer: Timer) => void
  onRemove: (id: number) => void
  onRenameRequest: (timer: Timer) => void
}

export const TimerCard = ({
  timer,
  onToggle,
  onReset,
  onAdjustRequest,
  onRemove,
  onRenameRequest
}: TimerCardProps): JSX.Element => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: timer.id
  })
  const dragHandleProps = { ...attributes, ...listeners } as JSX.HTMLAttributes<HTMLDivElement>
  const stopDrag: JSX.PointerEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation()
  }
  const [isAltDown, setIsAltDown] = useState(false)
  const handleToggleClick: JSX.MouseEventHandler<HTMLButtonElement> = (event) => {
    const allowMultiple = event.getModifierState('Alt')
    onToggle(timer.id, allowMultiple)
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
  const shouldGlow = !timer.running && isAltDown
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      class={`timer-card ${timer.running ? 'timer-card--running' : ''} ${isDragging ? 'timer-card--dragging' : ''}`}
      {...dragHandleProps}
    >
      <div class='timer-body'>
        <div class='timer-info'>
          <p class='timer-display'>{formatTime(timer.elapsed)}</p>
          <button
            class='timer-label-btn'
            type='button'
            onClick={() => onRenameRequest(timer)}
            onPointerDown={stopDrag}
            aria-label='Edit timer name'
          >
            {timer.label}
          </button>
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
              <Pause class='icon' size={18} strokeWidth={2.2} aria-hidden='true' />
            ) : (
              <Play class='icon' size={18} strokeWidth={2.2} aria-hidden='true' />
            )}
          </button>
          <button
            type='button'
            class='ghost-btn reset-btn'
            onClick={() => onReset(timer.id)}
            onPointerDown={stopDrag}
          >
            <RotateCcw class='icon' size={18} strokeWidth={2.2} aria-hidden='true' />
            <span class='sr-only'>Reset</span>
          </button>
          <button
            type='button'
            class='ghost-btn adjust-btn'
            onClick={() => onAdjustRequest(timer)}
            onPointerDown={stopDrag}
            aria-label='Adjust time'
          >
            <Clock class='icon' size={18} strokeWidth={2.2} aria-hidden='true' />
            <span class='sr-only'>Adjust</span>
          </button>
          <button
            class='ghost-btn remove-btn'
            type='button'
            onClick={() => onRemove(timer.id)}
            onPointerDown={stopDrag}
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
