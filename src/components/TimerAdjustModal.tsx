import type { JSX } from 'preact'
import { useMemo } from 'preact/hooks'
import { formatTime } from '../utils/time'

const PRESET_MINUTES = [1, 5, 10, 15, 25, 30, 45, 60]

const formatMinutes = (minutes: number): string => {
  if (minutes > 0) return `+${minutes}`
  if (minutes < 0) return `-${Math.abs(minutes)}`
  return '0'
}

type TimerAdjustModalProps = {
  label: string
  minutes: number
  maxMinutes: number
  minMinutes: number
  onChange: (minutes: number) => void
  onClose: () => void
  onSubmit: (event: Event) => void
}

export const TimerAdjustModal = ({
  label,
  minutes,
  maxMinutes,
  minMinutes,
  onChange,
  onClose,
  onSubmit
}: TimerAdjustModalProps): JSX.Element => {
  const presets = useMemo(() => {
    const negative = PRESET_MINUTES
      .filter((value) => -value >= minMinutes)
      .map((value) => -value)
      .reverse()
    const positive = PRESET_MINUTES.filter((value) => value <= maxMinutes)
    return [...negative, ...positive]
  }, [maxMinutes, minMinutes])

  const clampMinutes = (value: number): number =>
    Math.min(Math.max(value, minMinutes), maxMinutes)

  const handleRangeInput = (event: Event): void => {
    const value = Number((event.target as HTMLInputElement).value)
    onChange(clampMinutes(value))
  }

  const handlePreset = (value: number): void => {
    onChange(clampMinutes(value))
  }

  const handleStep = (delta: number): void => {
    onChange(clampMinutes(minutes + delta))
  }

  return (
    <div class='modal-backdrop' onClick={onClose}>
      <div
        class='modal modal--adjust'
        role='dialog'
        aria-modal='true'
        aria-labelledby='timer-adjust-title'
        onClick={(event) => event.stopPropagation()}
      >
        <form class='modal-form adjust-form' onSubmit={onSubmit}>
          <h2 class='modal-title' id='timer-adjust-title'>
            Adjust time
          </h2>
          <p class='adjust-subtitle'>Shift minutes for {label}</p>
          <div class='transfer-scrub'>
            <div class='transfer-scrub-header'>
              <p class='transfer-label'>Minutes to shift</p>
              <p class='transfer-available'>
                Range {formatMinutes(minMinutes)} to {formatMinutes(maxMinutes)} min
              </p>
            </div>
            <input
              class='transfer-range'
              type='range'
              min={minMinutes}
              max={maxMinutes}
              step={1}
              value={minutes}
              onInput={handleRangeInput}
              aria-label='Minutes to shift'
            />
            <div class='transfer-amount'>
              <p class='transfer-amount-value'>{formatMinutes(minutes)} min</p>
              <p class='transfer-amount-time'>{formatTime(Math.abs(minutes) * 60)}</p>
            </div>
            <div class='transfer-stepper'>
              <button
                class='transfer-step'
                type='button'
                onClick={() => handleStep(-1)}
                disabled={minutes <= minMinutes}
                aria-label='Decrease by 1 minute'
              >
                -1m
              </button>
              <button
                class='transfer-step'
                type='button'
                onClick={() => handleStep(1)}
                disabled={minutes >= maxMinutes}
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
              >
                {formatMinutes(value)} min
              </button>
            ))}
          </div>
          <div class='modal-actions'>
            <button class='modal-btn' type='button' onClick={onClose}>
              Cancel
            </button>
            <button
              class='modal-btn modal-btn--primary'
              type='submit'
              disabled={minutes === 0}
            >
              Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
