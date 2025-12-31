import type { JSX } from 'preact'
import { useCallback, useEffect, useMemo, useRef } from 'preact/hooks'

const ITEM_HEIGHT = 36

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
  const listRef = useRef<HTMLDivElement | null>(null)
  const options = useMemo(
    () => Array.from({ length: maxMinutes - minMinutes + 1 }, (_, index) => maxMinutes - index),
    [maxMinutes, minMinutes]
  )

  useEffect(() => {
    const targetIndex = options.indexOf(minutes)
    if (targetIndex === -1) return
    if (!listRef.current) return
    listRef.current.scrollTop = targetIndex * ITEM_HEIGHT
  }, [minutes, options])

  const handleScroll = useCallback((): void => {
    const el = listRef.current
    if (!el) return
    const index = Math.round(el.scrollTop / ITEM_HEIGHT)
    const clampedIndex = Math.min(Math.max(index, 0), options.length - 1)
    const nextValue = options[clampedIndex]
    if (nextValue !== minutes) onChange(nextValue)
  }, [minutes, onChange, options])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll)
    return () => {
      el.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  const handleSelect = (value: number): void => {
    if (!listRef.current) {
      onChange(value)
      return
    }
    const nextIndex = options.indexOf(value)
    listRef.current.scrollTo({
      top: nextIndex * ITEM_HEIGHT,
      behavior: 'smooth'
    })
    onChange(value)
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
        <form class='modal-form' onSubmit={onSubmit}>
          <h2 class='modal-title' id='timer-adjust-title'>
            Adjust time
          </h2>
          <p class='adjust-subtitle'>Shift minutes for {label}</p>
          <div class='adjust-wheel'>
            <div
              class='adjust-wheel-track'
              ref={listRef}
            >
              {options.map((value) => (
                <button
                  key={value}
                  type='button'
                  class={`adjust-wheel-item ${value === minutes ? 'is-active' : ''}`}
                  onClick={() => handleSelect(value)}
                >
                  {formatMinutes(value)}
                </button>
              ))}
            </div>
            <div class='adjust-wheel-indicator' aria-hidden='true' />
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
