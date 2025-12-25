import type { JSX } from 'preact'
import { Pause, Play, RotateCcw, X } from 'lucide-preact'
import type { Timer } from '../types'
import { formatTime } from '../utils/time'

type TimerCardProps = {
  timer: Timer
  onToggle: (id: number) => void
  onReset: (id: number) => void
  onRemove: (id: number) => void
  onRenameRequest: (timer: Timer) => void
}

export const TimerCard = ({ timer, onToggle, onReset, onRemove, onRenameRequest }: TimerCardProps): JSX.Element => {
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
