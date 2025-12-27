import type { JSX } from 'preact'
import { useMemo } from 'preact/hooks'
import type { Timer } from '../types'
import { formatTime } from '../utils/time'

const PRESET_MINUTES = [1, 5, 10, 15, 25, 30, 45, 60]

type TimerTransferModalProps = {
  source: Timer
  targets: Timer[]
  minutes: number
  maxMinutes: number
  onMinutesChange: (minutes: number) => void
  onClose: () => void
  onTransfer: (targetId: number) => void
}

export const TimerTransferModal = ({
  source,
  targets,
  minutes,
  maxMinutes,
  onMinutesChange,
  onClose,
  onTransfer
}: TimerTransferModalProps): JSX.Element => {
  const safeMax = Math.max(0, maxMinutes)
  const presets = useMemo(
    () => PRESET_MINUTES.filter((value) => value <= safeMax),
    [safeMax]
  )
  const clampMinutes = (value: number): number =>
    Math.min(Math.max(value, 0), safeMax)
  const showAllPreset = safeMax > 0 && !presets.includes(safeMax)

  const handleRangeInput = (event: Event): void => {
    const value = Number((event.target as HTMLInputElement).value)
    onMinutesChange(clampMinutes(value))
  }

  const handlePreset = (value: number): void => {
    onMinutesChange(clampMinutes(value))
  }

  const handleStep = (delta: number): void => {
    onMinutesChange(clampMinutes(minutes + delta))
  }

  const isTransferReady = minutes > 0 && safeMax > 0
  const targetEmptyMessage = safeMax === 0
    ? 'No full minutes to move yet.'
    : 'Add another timer to move time.'

  return (
    <div class='modal-backdrop' onClick={onClose}>
      <div
        class='modal modal--transfer'
        role='dialog'
        aria-modal='true'
        aria-labelledby='timer-transfer-title'
        onClick={(event) => event.stopPropagation()}
      >
        <div class='modal-form transfer-form'>
          <h2 class='modal-title' id='timer-transfer-title'>
            Move time
          </h2>
          <p class='transfer-subtitle'>
            From {source.label} - {formatTime(source.elapsed)}
          </p>

          <div class='transfer-scrub'>
            <div class='transfer-scrub-header'>
              <p class='transfer-label'>Minutes to move</p>
              <p class='transfer-available'>Available {safeMax} min</p>
            </div>
            <input
              class='transfer-range'
              type='range'
              min={0}
              max={safeMax}
              step={1}
              value={minutes}
              onInput={handleRangeInput}
              disabled={safeMax === 0}
              aria-label='Minutes to move'
            />
            <div class='transfer-amount'>
              <p class='transfer-amount-value'>{minutes} min</p>
              <p class='transfer-amount-time'>{formatTime(minutes * 60)}</p>
            </div>
            <div class='transfer-stepper'>
              <button
                class='transfer-step'
                type='button'
                onClick={() => handleStep(-1)}
                disabled={minutes <= 0}
                aria-label='Decrease by 1 minute'
              >
                -1m
              </button>
              <button
                class='transfer-step'
                type='button'
                onClick={() => handleStep(1)}
                disabled={minutes >= safeMax}
                aria-label='Increase by 1 minute'
              >
                +1m
              </button>
            </div>
          </div>

          <div class='transfer-presets'>
            {presets.map((value) => (
              <button
                key={value}
                class={`transfer-preset ${value === minutes ? 'is-active' : ''}`}
                type='button'
                onClick={() => handlePreset(value)}
                disabled={safeMax === 0}
              >
                {value} min
              </button>
            ))}
            {showAllPreset && (
              <button
                class={`transfer-preset ${safeMax === minutes ? 'is-active' : ''}`}
                type='button'
                onClick={() => handlePreset(safeMax)}
              >
                All
              </button>
            )}
          </div>

          <div class='transfer-targets'>
            <p class='transfer-targets-title'>Tap a timer to receive</p>
            {targets.length === 0 ? (
              <p class='transfer-targets-empty'>{targetEmptyMessage}</p>
            ) : (
              <>
                {safeMax === 0 && (
                  <p class='transfer-targets-empty'>No full minutes to move yet.</p>
                )}
                <div class='transfer-targets-grid'>
                  {targets.map((target) => (
                    <button
                      key={target.id}
                      class='transfer-target'
                      type='button'
                      onClick={() => onTransfer(target.id)}
                      disabled={!isTransferReady}
                    >
                      <span class='transfer-target-label'>{target.label}</span>
                      <span class='transfer-target-time'>{formatTime(target.elapsed)}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div class='modal-actions'>
            <button class='modal-btn' type='button' onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
