import type { JSX } from 'preact'
import { Briefcase, Shield, SquareAsterisk } from 'lucide-preact'
import { MAX_NOTE_LENGTH } from '../constants'
import { CASE_CATEGORIES, TIMER_TYPES, type CaseCategory, type TimerType } from '../types'

export const TimerTypeIcon = ({ type }: { type: TimerType }): JSX.Element => {
  switch (type) {
    case 'Admin':
      return <Shield class='icon' aria-hidden='true' />
    case 'Case':
      return <Briefcase class='icon' aria-hidden='true' />
    case 'Other':
      return <SquareAsterisk class='icon' aria-hidden='true' />
    default:
      return <SquareAsterisk class='icon' aria-hidden='true' />
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
    <div class='modal-backdrop' onClick={onClose}>
      <div
        class='modal'
        role='dialog'
        aria-modal='true'
        aria-labelledby='timer-modal-title'
        onClick={(event) => event.stopPropagation()}
      >
        <form class='modal-form' onSubmit={onSubmit} noValidate>
          <h2 class='modal-title' id='timer-modal-title'>
            {mode === 'add' ? 'New timer' : 'Edit timer'}
          </h2>
          <label class='modal-label' htmlFor='timer-name'>
            {labelText}
          </label>
          <input
            id='timer-name'
            ref={inputRef}
            class='modal-input'
            type='text'
            value={label}
            onInput={onInput}
            {...inputProps}
            aria-invalid={error ? 'true' : 'false'}
          />
          {error && (
            <p class='modal-error' role='status'>
              {error}
            </p>
          )}
          {onTypeChange && (
            <>
              <label class='modal-label' id='timer-type-label'>
                Timer type
              </label>
              <div
                class='timer-type-control timer-type-control--modal'
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
                      class={`timer-type-btn ${isActive ? 'timer-type-btn--active' : ''}`}
                      onClick={() => onTypeChange(typeOption)}
                    >
                      <TimerTypeIcon type={typeOption} />
                      <span class='sr-only'>{typeOption}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
          {timerType === 'Case' && onCaseCategoryChange && (
            <>
              <label class='modal-label' id='case-category-label'>
                Case category
              </label>
              <div
                class='timer-type-control timer-type-control--modal timer-type-control--text'
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
                      class={`timer-type-btn timer-type-btn--text ${isActive ? 'timer-type-btn--active' : ''}`}
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
              <label class='modal-label' htmlFor='timer-note'>
                Note
              </label>
              <textarea
                id='timer-note'
                class='modal-input modal-textarea'
                value={caseNote ?? ''}
                onInput={(event) => onCaseNoteChange(event.currentTarget.value)}
                rows={3}
                maxLength={MAX_NOTE_LENGTH}
                placeholder='Add a note...'
              />
            </>
          )}
          <div class='modal-actions'>
            <button class='modal-btn' type='button' onClick={onClose}>
              Cancel
            </button>
            <button class='modal-btn modal-btn--primary' type='submit'>
              {mode === 'add' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
