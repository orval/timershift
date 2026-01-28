import type { JSX } from 'preact'
import { useMemo } from 'preact/hooks'
import type { Timer } from '../types'
import { formatTime } from '../utils/time'
import { buttonSecondaryClass, modalOverlayClass, modalShellBaseClass } from './uiClasses'

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
  const isAllPresetActive = safeMax === minutes
  const allPresetToneClass = isAllPresetActive
    ? 'bg-transfer-active text-text-bright border-white/80 shadow-preset-active'
    : 'bg-[hsla(var(--preset-hue),_80%,_55%,_var(--preset-alpha))] text-[hsl(var(--preset-hue),_85%,_var(--preset-text-light))] border-[hsla(var(--preset-hue),_80%,_60%,_var(--preset-border-alpha))] hover:bg-[hsla(var(--preset-hue),_80%,_60%,_0.22)] hover:text-[hsl(var(--preset-hue),_90%,_78%)]'

  const handleRangeInput = (event: Event): void => {
    const value = Number((event.target as HTMLInputElement).value)
    onMinutesChange(clampMinutes(value))
  }

  const handlePreset = (value: number): void => {
    onMinutesChange(clampMinutes(value))
  }

  const getPresetStyle = (value: number): JSX.CSSProperties => {
    if (safeMax <= 0) return {}
    const ratio = Math.min(Math.max(value / safeMax, 0), 1)
    const hue = 190 + ratio * 25
    const alpha = 0.08 + ratio * 0.22
    const borderAlpha = 0.22 + ratio * 0.46
    const textLight = 70 + ratio * 10
    return {
      '--preset-hue': hue.toFixed(1),
      '--preset-alpha': alpha.toFixed(3),
      '--preset-border-alpha': borderAlpha.toFixed(3),
      '--preset-text-light': `${textLight.toFixed(1)}%`
    } as JSX.CSSProperties
  }

  const isTransferReady = minutes > 0 && safeMax > 0
  const targetEmptyMessage = safeMax === 0
    ? 'No full minutes to move yet.'
    : 'Add another timer to move time.'

  return (
    <div className={modalOverlayClass} onClick={onClose}>
      <div
        className={`${modalShellBaseClass} max-w-[520px]`}
        role='dialog'
        aria-modal='true'
        aria-labelledby='timer-transfer-title'
        onClick={(event) => event.stopPropagation()}
      >
        <div className='flex flex-col gap-lg'>
          <h2 className='mb-xs text-xl font-bold text-text-bright' id='timer-transfer-title'>
            Move time
          </h2>
          <p className='m-0 text-sm text-text-muted'>
            From {source.label} - {formatTime(source.elapsed)}
          </p>

          <div className='grid gap-lg rounded-lg border border-white-mid bg-white-low p-sm'>
            <div className='flex items-center justify-between gap-lg'>
              <p className='m-0 text-sm font-semibold text-text-strong'>Minutes to move</p>
              <p className='m-0 text-sm text-text-muted'>Available {safeMax} min</p>
            </div>
            <input
              className='w-full accent-accent disabled:opacity-50'
              type='range'
              min={0}
              max={safeMax}
              step={1}
              value={minutes}
              onInput={handleRangeInput}
              disabled={safeMax === 0}
              aria-label='Minutes to move'
            />
            <div className='flex items-baseline justify-between gap-lg'>
              <p className='m-0 text-2xl font-bold text-text-bright'>{minutes} min</p>
              <p className='m-0 text-sm tabular-nums text-text-muted'>{formatTime(minutes * 60)}</p>
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
                    className={`rounded-md border px-sm py-xs text-sm font-semibold transition-[background,color,border-color] duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${presetToneClass}`}
                    type='button'
                    onClick={() => handlePreset(value)}
                    disabled={safeMax === 0}
                    style={getPresetStyle(value)}
                  >
                    {value} min
                  </button>
                )
              })}
              {showAllPreset && (
                <button
                  className={`rounded-md border px-sm py-xs text-sm font-semibold transition-[background,color,border-color] duration-150 ${allPresetToneClass}`}
                  type='button'
                  onClick={() => handlePreset(safeMax)}
                  style={getPresetStyle(safeMax)}
                >
                  All
                </button>
              )}
            </div>
          </div>

          <div className='flex flex-col gap-xs'>
            <p className='m-0 text-sm text-text-muted'>Tap a timer to receive</p>
            {targets.length === 0 ? (
              <p className='m-0 text-sm text-text-muted'>{targetEmptyMessage}</p>
            ) : (
              <>
                {safeMax === 0 && (
                  <p className='m-0 text-sm text-text-muted'>No full minutes to move yet.</p>
                )}
                <div className='grid max-h-[min(240px,35vh)] gap-xs overflow-y-auto pr-0.5'>
                  {targets.map((target) => (
                    <button
                      key={target.id}
                      className='flex items-center justify-between gap-lg rounded-md border border-white-mid bg-white-low p-sm text-left text-text-bright transition-[background,transform] duration-150 hover:bg-white-mid active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60'
                      type='button'
                      onClick={() => onTransfer(target.id)}
                      disabled={!isTransferReady}
                    >
                      <span className='text-md font-semibold text-text-bright'>{target.label}</span>
                      <span className='text-sm tabular-nums text-text-muted'>{formatTime(target.elapsed)}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className='flex justify-end gap-xs'>
            <button
              className={buttonSecondaryClass}
              type='button'
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
