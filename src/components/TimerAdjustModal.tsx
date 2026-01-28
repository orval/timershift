import type { JSX } from 'preact'
import { useMemo } from 'preact/hooks'
import { formatTime } from '../utils/time'
import {
  buttonPrimaryDisabledClass,
  buttonSecondaryClass,
  modalOverlayClass,
  modalShellBaseClass
} from './uiClasses'

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

  const negativeBound = Math.max(0, Math.abs(minMinutes))
  const positiveBound = Math.max(0, maxMinutes)
  const getPresetStyle = (value: number): JSX.CSSProperties => {
    if (value === 0) return {}
    const isNegative = value < 0
    const bound = isNegative ? negativeBound : positiveBound
    if (bound === 0) return {}
    const ratio = Math.min(Math.abs(value) / bound, 1)
    const hue = isNegative ? 8 + ratio * 18 : 185 + ratio * 28
    const alpha = 0.08 + ratio * 0.22
    const borderAlpha = 0.22 + ratio * 0.46
    const textLight = 70 + ratio * 12
    return {
      '--preset-hue': hue.toFixed(1),
      '--preset-alpha': alpha.toFixed(3),
      '--preset-border-alpha': borderAlpha.toFixed(3),
      '--preset-text-light': `${textLight.toFixed(1)}%`
    } as JSX.CSSProperties
  }

  return (
    <div className={modalOverlayClass} onClick={onClose}>
      <div
        className={`${modalShellBaseClass} max-w-[420px]`}
        role='dialog'
        aria-modal='true'
        aria-labelledby='timer-adjust-title'
        onClick={(event) => event.stopPropagation()}
      >
        <form className='flex flex-col gap-lg' onSubmit={onSubmit}>
          <h2 className='mb-xs text-xl font-bold text-text-bright' id='timer-adjust-title'>
            Adjust time
          </h2>
          <p className='m-0 text-sm text-text-muted'>
            Adjust minutes for <strong className='font-bold text-text-soft'>{label}</strong>
          </p>
          <div className='grid gap-lg rounded-lg border border-white-mid bg-white-low p-sm'>
            <div className='flex items-center justify-between gap-lg'>
              <p className='m-0 text-sm font-semibold text-text-strong'>Minutes to adjust</p>
              <p className='m-0 text-sm text-text-muted'>
                Range {formatMinutes(minMinutes)} to {formatMinutes(maxMinutes)} min
              </p>
            </div>
            <input
              className='w-full accent-accent disabled:opacity-50'
              type='range'
              min={minMinutes}
              max={maxMinutes}
              step={1}
              value={minutes}
              onInput={handleRangeInput}
              aria-label='Minutes to adjust'
            />
            <div className='flex items-baseline justify-between gap-lg'>
              <p className='m-0 text-2xl font-bold text-text-bright'>{formatMinutes(minutes)} min</p>
              <p className='m-0 text-sm tabular-nums text-text-muted'>{formatTime(Math.abs(minutes) * 60)}</p>
            </div>
            <div className='flex flex-wrap gap-xs'>
              {presets.map((value) => {
                const isActive = value === minutes
                const presetToneClass = isActive
                  ? 'bg-transfer-active text-text-bright border-white/80 shadow-preset-active'
                  : 'bg-[hsla(var(--preset-hue),_80%,_55%,_var(--preset-alpha))] text-[hsl(var(--preset-hue),_85%,_var(--preset-text-light))] border-[hsla(var(--preset-hue),_80%,_60%,_var(--preset-border-alpha))] hover:bg-[hsla(var(--preset-hue),_80%,_60%,_0.22)] hover:text-[hsl(var(--preset-hue),_90%,_78%)]'
                return (
                  <button
                    key={value}
                    className={`rounded-md border px-sm py-xs text-sm font-semibold transition-[background,color,border-color] duration-150 ${presetToneClass}`}
                    type='button'
                    onClick={() => handlePreset(value)}
                    style={getPresetStyle(value)}
                  >
                    {formatMinutes(value)} min
                  </button>
                )
              })}
            </div>
          </div>
          <div className='flex justify-end gap-xs'>
            <button
              className={buttonSecondaryClass}
              type='button'
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className={buttonPrimaryDisabledClass}
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
