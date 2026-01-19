export const TIMER_TYPES = ['Admin', 'Case', 'Other'] as const
export type TimerType = (typeof TIMER_TYPES)[number]
export const DEFAULT_TIMER_TYPE: TimerType = 'Case'

export const CASE_CATEGORIES = ['Prep', 'Follow Up', 'Internal', 'SFC', 'MPR', 'MPRT', 'Community', 'Other'] as const
export type CaseCategory = (typeof CASE_CATEGORIES)[number]
export const DEFAULT_CASE_CATEGORY: CaseCategory = 'Prep'

export type Timer = {
  id: number
  label: string
  type: TimerType
  caseCategory?: CaseCategory
  caseNote?: string
  elapsed: number
  running: boolean
}

export type RemovedTimerEntry = {
  entryId: string
  timer: Timer
  removedAt: number
}

export type LogEntry = {
  action:
    | 'remove'
    | 'restore'
    | 'add'
    | 'rename'
    | 'reset'
    | 'adjust'
    | 'transfer'
    | 'start'
    | 'pause'
    | 'app_start'
    | 'app_exit'
    | 'summary'
    | 'history_open'
    | 'history_close'
    | 'error'
  at: number
  timerId?: number
  label?: string
  elapsed?: number
  metadata?: Record<string, unknown>
}
