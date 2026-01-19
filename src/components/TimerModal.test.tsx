import { render, screen } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { MAX_NOTE_LENGTH } from '../constants'
import type { TimerType } from '../types'
import { TimerModal, TimerTypeIcon } from './TimerModal'

const baseProps = {
  mode: 'rename' as const,
  label: 'Timer',
  error: '',
  maxLabelLength: 60,
  inputRef: { current: null },
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  onInput: vi.fn()
}

test('lets you switch timer types in the modal', async () => {
  const user = userEvent.setup()
  const onTypeChange = vi.fn()

  render(
    <TimerModal
      {...baseProps}
      timerType='Admin'
      onTypeChange={onTypeChange}
    />
  )

  await user.click(screen.getByRole('radio', { name: /case timer type/i }))
  expect(onTypeChange).toHaveBeenCalledWith('Case')
})

test('falls back to the default icon for unknown timer types', () => {
  const { container: known } = render(<TimerTypeIcon type='Other' />)
  const { container: fallback } = render(
    <TimerTypeIcon type={'Unknown' as TimerType} />
  )

  expect(fallback.innerHTML).toBe(known.innerHTML)
})

test('renders an empty case note when none is provided', () => {
  render(
    <TimerModal
      {...baseProps}
      timerType='Case'
      onCaseNoteChange={vi.fn()}
    />
  )

  expect(screen.getByRole('textbox', { name: /note/i })).toHaveValue('')
})

test('updates case category and note fields', async () => {
  const user = userEvent.setup()
  const onCaseCategoryChange = vi.fn()
  const onCaseNoteChange = vi.fn()

  render(
    <TimerModal
      {...baseProps}
      timerType='Case'
      caseCategory='Prep'
      caseNote=''
      onTypeChange={vi.fn()}
      onCaseCategoryChange={onCaseCategoryChange}
      onCaseNoteChange={onCaseNoteChange}
    />
  )

  await user.click(screen.getByRole('radio', { name: /community/i }))
  expect(onCaseCategoryChange).toHaveBeenCalledWith('Community')

  const noteInput = screen.getByRole('textbox', { name: /note/i })
  await user.type(noteInput, 'Check docs')
  expect(onCaseNoteChange).toHaveBeenLastCalledWith('Check docs')
})

test('caps case note input at the max length', async () => {
  const user = userEvent.setup()
  const onCaseNoteChange = vi.fn()

  render(
    <TimerModal
      {...baseProps}
      timerType='Case'
      caseNote=''
      onCaseNoteChange={onCaseNoteChange}
    />
  )

  const noteInput = screen.getByRole('textbox', { name: /note/i })
  const longNote = 'a'.repeat(MAX_NOTE_LENGTH + 5)
  const expected = longNote.slice(0, MAX_NOTE_LENGTH)

  await user.type(noteInput, longNote)

  expect(noteInput).toHaveValue(expected)
  expect(onCaseNoteChange).toHaveBeenLastCalledWith(expected)
})
