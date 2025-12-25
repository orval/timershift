import type { JSX } from 'preact'

type TimerModalProps = {
  mode: 'add' | 'rename'
  label: string
  error: string
  maxLabelLength: number
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
  inputRef,
  onClose,
  onSubmit,
  onInput
}: TimerModalProps): JSX.Element => {
  return (
    <div class='modal-backdrop' onClick={onClose}>
      <div
        class='modal'
        role='dialog'
        aria-modal='true'
        aria-labelledby='timer-modal-title'
        onClick={(event) => event.stopPropagation()}
      >
        <form class='modal-form' onSubmit={onSubmit}>
          <h2 class='modal-title' id='timer-modal-title'>
            {mode === 'add' ? 'New timer' : 'Rename timer'}
          </h2>
          <label class='modal-label' htmlFor='timer-name'>
            Timer name
          </label>
          <input
            id='timer-name'
            ref={inputRef}
            class='modal-input'
            type='text'
            value={label}
            onInput={onInput}
            maxLength={maxLabelLength}
            aria-invalid={error ? 'true' : 'false'}
          />
          {error && (
            <p class='modal-error' role='status'>
              {error}
            </p>
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
