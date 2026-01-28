import type { JSX } from 'preact'
import { Briefcase, Shield, SquareAsterisk } from 'lucide-preact'
import { MAX_NOTE_LENGTH } from '../constants'
import { CASE_CATEGORIES, TIMER_TYPES, type CaseCategory, type TimerType } from '../types'
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  modalOverlayClass,
  modalShellBaseClass
} from './uiClasses'

export const TimerTypeIcon = ({ type }: { type: TimerType }): JSX.Element => {
  const iconProps = { size: 14, strokeWidth: 2.2, class: 'shrink-0' }
  switch (type) {
    case 'Admin':
      return <Shield {...iconProps} aria-hidden='true' />
    case 'Case':
      return <Briefcase {...iconProps} aria-hidden='true' />
    case 'Other':
      return <SquareAsterisk {...iconProps} aria-hidden='true' />
    default:
      return <SquareAsterisk {...iconProps} aria-hidden='true' />
  }
}

type TimerModalProps = {
  mode: 'add' | 'rename'
  label: string
  error: string
  maxLabelLength: number
  timerType: TimerType
  onTypeChange?: (type: TimerType) => void
  caseCategory?: CaseCategory
  caseNote?: string
  onCaseCategoryChange?: (category: CaseCategory) => void
  onCaseNoteChange?: (note: string) => void
  inputRef: { current: HTMLInputElement | null }
  onClose: () => void
  onSubmit: (event: Event) => void
  onInput: (event: Event) => void
}

export const TimerModal = ({
  mode,
  label,
  error,
  maxLabelLength,
  timerType,
  onTypeChange,
  caseCategory,
  caseNote,
  onCaseCategoryChange,
  onCaseNoteChange,
  inputRef,
  onClose,
  onSubmit,
  onInput
}: TimerModalProps): JSX.Element => {
  const labelText = timerType === 'Case' ? 'Case ID' : 'Timer name'
  const inputProps = timerType === 'Case'
    ? {
        inputMode: 'numeric',
        pattern: '[0-9]{8}',
        placeholder: '8 digits',
        maxLength: 8
      }
    : {
        inputMode: 'text',
        maxLength: maxLabelLength
      }
  return (
    <div className={modalOverlayClass} onClick={onClose}>
      <div
        className={`${modalShellBaseClass} max-w-[420px]`}
        role='dialog'
        aria-modal='true'
        aria-labelledby='timer-modal-title'
        onClick={(event) => event.stopPropagation()}
      >
        <form className='m-0' onSubmit={onSubmit} noValidate>
          <h2 className='mb-xs text-xl font-bold text-text-bright' id='timer-modal-title'>
            {mode === 'add' ? 'New timer' : 'Edit timer'}
          </h2>
          <label className='mb-xs block text-sm text-text-muted' htmlFor='timer-name'>
            {labelText}
          </label>
          <input
            id='timer-name'
            ref={inputRef}
            className='w-full rounded-md border border-white-high bg-white-mid p-sm text-md font-semibold text-text-bright focus:outline focus:outline-1 focus:outline-offset-2 focus:outline-accent/60'
            type='text'
            value={label}
            onInput={onInput}
            {...inputProps}
            aria-invalid={error ? 'true' : 'false'}
          />
          {error && (
            <p className='mt-xs text-sm text-text-red-light' role='status'>
              {error}
            </p>
          )}
          {onTypeChange && (
            <>
              <label className='mb-xs mt-sm block text-sm text-text-muted' id='timer-type-label'>
                Timer type
              </label>
              <div
                className='inline-flex items-center gap-px rounded-sm border border-white-mid bg-panel-bg p-px shadow-inset-border'
                role='radiogroup'
                aria-labelledby='timer-type-label'
              >
                {TIMER_TYPES.map((typeOption) => {
                  const isActive = timerType === typeOption
                  return (
                    <button
                      key={typeOption}
                      type='button'
                      role='radio'
                      aria-checked={isActive}
                      aria-label={`${typeOption} timer type`}
                      className={`inline-flex h-[18px] w-5 items-center justify-center rounded-sm p-0 transition-[background,color] duration-150 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent/75 ${isActive ? 'bg-accent/20 text-text-bright shadow-inset-accent' : 'text-text-muted hover:bg-white-low hover:text-text-bright'}`}
                      onClick={() => onTypeChange(typeOption)}
                    >
                      <TimerTypeIcon type={typeOption} />
                      <span className='sr-only'>{typeOption}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
          {timerType === 'Case' && onCaseCategoryChange && (
            <>
              <label className='mb-xs mt-sm block text-sm text-text-muted' id='case-category-label'>
                Case category
              </label>
              <div
                className='inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-sm border border-white-mid bg-panel-bg p-px shadow-inset-border'
                role='radiogroup'
                aria-labelledby='case-category-label'
              >
                {CASE_CATEGORIES.map((category) => {
                  const isActive = caseCategory === category
                  return (
                    <button
                      key={category}
                      type='button'
                      role='radio'
                      aria-checked={isActive}
                      className={`whitespace-nowrap rounded-sm px-sm py-xs text-sm font-semibold leading-[1.1] transition-[background,color] duration-150 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent/75 ${isActive ? 'bg-accent/20 text-text-bright shadow-inset-accent' : 'text-text-muted hover:bg-white-low hover:text-text-bright'}`}
                      onClick={() => onCaseCategoryChange(category)}
                    >
                      {category}
                    </button>
                  )
                })}
              </div>
            </>
          )}
          {onCaseNoteChange && (
            <>
              <label className='mb-xs mt-sm block text-sm text-text-muted' htmlFor='timer-note'>
                Note
              </label>
            <textarea
              id='timer-note'
              className='min-h-[96px] w-full resize-y rounded-md border border-white-high bg-white-mid p-sm text-md font-medium text-text-bright focus:outline focus:outline-1 focus:outline-offset-2 focus:outline-accent/60'
              value={caseNote ?? ''}
              onInput={(event) => onCaseNoteChange(event.currentTarget.value)}
              rows={3}
                maxLength={MAX_NOTE_LENGTH}
                placeholder='Add a note...'
              />
            </>
          )}
          <div className='mt-lg flex justify-end gap-xs'>
            <button
              className={buttonSecondaryClass}
              type='button'
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className={buttonPrimaryClass}
              type='submit'
            >
              {mode === 'add' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
