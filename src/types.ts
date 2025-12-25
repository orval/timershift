export type Timer = {
  id: number
  label: string
  elapsed: number
  running: boolean
}

export type RemovedTimerEntry = {
  entryId: string
  timer: Timer
  removedAt: number
}

export type HistoryLogEntry = {
  action:
    | 'remove'
    | 'restore'
    | 'add'
    | 'rename'
    | 'reset'
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
