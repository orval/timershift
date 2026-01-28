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
  const typeTint = timer.type === 'Admin'
    ? 'var(--timer-tint-admin)'
    : timer.type === 'Case'
        ? 'var(--timer-tint-case)'
        : 'var(--timer-tint-break)'
  const cardVisualClass = isDragging
    ? 'opacity-65 border-border-default shadow-timer-dragging'
    : timer.running
      ? 'border-text-green/60 shadow-timer-running'
      : isPaused
        ? 'border-text-orange/60 shadow-timer-paused'
        : 'border-white-mid shadow-timer-default'
  const cardCursorClass = isDragging ? 'cursor-grabbing' : 'cursor-grab'
  const actionBorderClass = shouldGlow
    ? 'border-accent/50'
    : timer.running
        ? 'border-text-orange/50'
        : 'border-text-green/[0.45]'
  const actionToneClass = timer.running
    ? 'bg-text-orange/10 text-text-orange hover:bg-text-orange/20 hover:text-text-orange-light'
    : 'bg-text-green/[0.08] text-text-green hover:bg-text-green/[0.18] hover:text-text-green-light'
  const actionShadowClass = shouldGlow
    ? 'shadow-action-glow'
    : 'shadow-base'
  const copyToneClass = isCopied
    ? 'bg-text-green/[0.18] text-text-green-light border-text-green/[0.45] hover:bg-text-green/[0.24] hover:text-text-green-lighter'
    : 'bg-white-mid text-text-icon-muted hover:bg-white-high hover:text-text-bright'
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    '--timer-card-tint': typeTint,
    '--timer-card-bg': 'linear-gradient(155deg, var(--timer-card-tint), transparent 60%), var(--bg-gradient)'
  } as JSX.CSSProperties

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`timer-card ${typeClass} flex touch-none flex-col gap-xs rounded-md border px-md py-1.5 shadow-lg transition-[border-color,box-shadow,opacity] duration-150 [background:var(--timer-card-bg)] ${cardCursorClass} ${cardVisualClass}`}
      onClick={handleCardClick}
      {...dragHandleProps}
    >
      <div className='flex items-center justify-between gap-lg'>
        <div className='flex min-w-0 flex-1 flex-col'>
          <div className='flex flex-wrap items-center gap-lg'>
            <p className='m-0 min-w-0 text-2xl font-medium tabular-nums tracking-[0.04em] text-text-bright [text-shadow:0_0_var(--space-xl)_var(--text-glow-35)]'>
              {formatTime(timer.elapsed)}
            </p>
          </div>
          <div className='mt-0.5 flex min-w-0 items-center gap-xs'>
            <button
              className='max-w-full shrink-0 truncate rounded-md bg-transparent p-0 text-left text-md font-medium text-text-label transition-colors duration-150 hover:text-text-soft focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-border-strong'
              type='button'
              onClick={handleRenameClick}
              onPointerDown={stopDrag}
              aria-label='Edit timer details'
            >
              {timer.label}
            </button>
            {timer.type === 'Case' && (
              <div
                className='relative inline-flex items-center'
                ref={categoryPopoverRef}
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  className='inline-flex items-center whitespace-nowrap rounded-sm border border-white-mid bg-white-mid px-1.5 py-0.5 text-sm text-text-soft transition-[background,color,border-color] duration-150 hover:bg-white-mid hover:text-text-bright focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent/75'
                  type='button'
                  aria-haspopup='listbox'
                  aria-expanded={isCategoryOpen ? 'true' : 'false'}
                  onClick={handleCategoryToggle}
                >
                  {currentCategory}
                </button>
                {isCategoryOpen && (
                  <div
                    className='absolute left-0 top-full z-10 mt-1.5 flex min-w-[180px] flex-wrap gap-xs rounded-md border border-white-mid bg-popover-bg p-1.5 shadow-popover'
                    role='listbox'
                    aria-label='Case category'
                  >
                    {CASE_CATEGORIES.map((category) => {
                      const isActive = currentCategory === category
                      return (
                        <button
                          key={category}
                          className={`whitespace-nowrap rounded-sm border bg-transparent px-1.5 py-xs text-sm font-semibold transition-[background,color,border-color,box-shadow] duration-150 ${isActive ? 'border-accent/60 bg-accent/30 text-text-bright shadow-inset-accent' : 'border-transparent text-text-soft hover:border-accent/40 hover:bg-accent/10 hover:text-text-bright'}`}
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
              className={`inline-flex size-icon-md shrink-0 items-center justify-center rounded-md transition-[background,color,transform] duration-150 active:translate-y-px ${copyToneClass}`}
              type='button'
              onClick={handleCopyClick}
              onPointerDown={stopDrag}
              aria-label={isCopied ? 'Copied timer name' : 'Copy timer name'}
              title={isCopied ? 'Copied' : 'Copy name'}
            >
              {isCopied ? (
                <Check size={12} strokeWidth={2.2} aria-hidden='true' />
              ) : (
                <Copy size={12} strokeWidth={2.2} aria-hidden='true' />
              )}
            </button>
            {notePreview && (
              <span
                className='flex-1 truncate text-md leading-[1.2] text-text-muted'
                title={normalizedNote}
              >
                {notePreview}
              </span>
            )}
          </div>
        </div>
        <div className='flex items-center gap-xs'>
          <button
            type='button'
            className={`inline-flex size-btn items-center justify-center rounded-md border p-0 transition-[transform,box-shadow,background,color,border-color] duration-150 active:translate-y-px ${actionBorderClass} ${actionToneClass} ${actionShadowClass}`}
            aria-label={timer.running ? 'Pause timer' : 'Start timer'}
            onClick={handleToggleClick}
            onPointerDown={stopDrag}
          >
            <span className='sr-only'>{timer.running ? 'Pause' : 'Start'}</span>
            {timer.running ? (
              <Pause size={16} strokeWidth={2.2} aria-hidden='true' />
            ) : (
              <Play size={16} strokeWidth={2.2} aria-hidden='true' />
            )}
          </button>
          <button
            type='button'
            className='inline-flex size-btn items-center justify-center gap-xs rounded-md border border-reset-btn-border bg-reset-btn-bg p-0 text-reset-btn-text shadow-base transition-[transform,box-shadow,background,color] duration-150 hover:bg-reset-btn-bg-hover hover:text-reset-btn-text-hover hover:shadow-button-hover active:translate-y-px'
            onClick={() => onReset(timer.id)}
            onPointerDown={stopDrag}
          >
            <RotateCcw size={16} strokeWidth={2.2} aria-hidden='true' />
            <span className='sr-only'>Reset</span>
          </button>
          <button
            type='button'
            className='inline-flex size-btn items-center justify-center rounded-md border border-border-default bg-slate-12 p-0 text-text-blue transition-[transform,background,color] duration-150 hover:bg-slate-20 hover:text-text-soft active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50'
            onClick={() => onTransferRequest(timer)}
            onPointerDown={stopDrag}
            aria-label='Move time'
            disabled={!canTransfer}
          >
            <ArrowLeftRight size={16} strokeWidth={2.2} aria-hidden='true' />
            <span className='sr-only'>Move time</span>
          </button>
          <button
            type='button'
            className='inline-flex size-btn items-center justify-center rounded-md border border-border-default bg-slate-12 p-0 text-text-blue transition-[transform,background,color] duration-150 hover:bg-slate-20 hover:text-text-soft active:translate-y-px'
            onClick={() => onAdjustRequest(timer)}
            onPointerDown={stopDrag}
            aria-label='Adjust time'
          >
            <ChevronsUpDown size={16} strokeWidth={2.2} aria-hidden='true' />
            <span className='sr-only'>Adjust</span>
          </button>
          <button
            className='inline-flex size-btn items-center justify-center rounded-md border border-text-red/[0.35] bg-text-red/[0.12] p-0 text-text-red transition-[transform,background,color] duration-150 hover:bg-text-red/20 hover:text-text-red-light active:translate-y-px'
            type='button'
            onClick={() => onRemove(timer.id)}
            onPointerDown={stopDrag}
            aria-label='Remove timer'
          >
            <X size={16} strokeWidth={2.2} aria-hidden='true' />
            <span className='sr-only'>Remove</span>
          </button>
        </div>
      </div>
    </div>
  )
}
