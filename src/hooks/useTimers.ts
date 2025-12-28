import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { MAX_LABEL_LENGTH } from '../constants'
import type { RemovedTimerEntry, Timer } from '../types'
import { appendLogEntry, buildLogEntry } from '../utils/history'

const STORAGE_KEY = 'timershift:timers'
const HISTORY_KEY = 'timershift:history'
const HISTORY_LIMIT = 40

export const useTimers = (): {
  timers: Timer[]
  displayTimers: Timer[]
  removedTimers: RemovedTimerEntry[]
  hasRunningTimer: boolean
  pausedDisplayTimerId: number | null
  toggleTimer: (id: number, allowMultiple: boolean) => void
  resetTimer: (id: number) => void
  adjustTimerMinutes: (id: number, minutes: number) => void
  transferTimerMinutes: (sourceId: number, targetId: number, minutes: number) => void
  restoreTimerSnapshot: (snapshot: Timer) => void
  removeTimer: (id: number) => void
  addTimer: (label: string) => void
  renameTimer: (id: number, label: string) => void
  restoreTimer: (entry: RemovedTimerEntry) => void
  reorderTimers: (sourceId: number, targetId: number) => void
  isDuplicateLabel: (label: string, excludeId?: number | null) => boolean
} => {
  const initLoadErrorRef = useRef<string | null>(null)
  const [timers, setTimers] = useState<Timer[]>(() => {
    if (typeof window === 'undefined') {
      return []
    }

    const savedRaw = window.localStorage.getItem(STORAGE_KEY)
    if (savedRaw) {
      try {
        const parsed = JSON.parse(savedRaw) as { timers?: Timer[], savedAt?: number }
        const restored = (parsed.timers ?? []).map((timer) => ({ ...timer, running: false }))
        if (restored.length > 0) return restored
      } catch (error) {
        initLoadErrorRef.current = String(error)
        // If parsing fails, fall back to defaults below.
      }
    }

    return []
  })
  const [removedTimers, setRemovedTimers] = useState<RemovedTimerEntry[]>(() => {
    if (typeof window === 'undefined') {
      return []
    }

    const savedRaw = window.localStorage.getItem(HISTORY_KEY)
    if (savedRaw) {
      try {
        const parsed = JSON.parse(savedRaw) as { removedTimers?: RemovedTimerEntry[] }
        return parsed.removedTimers ?? []
      } catch {
        // Fall back to empty history.
      }
    }

    return []
  })
  const lastRunningTimerIdRef = useRef<number | null>(null)
  const timersRef = useRef<Timer[]>(timers)

  const runningTimers = useMemo(
    () => timers.filter((timer) => timer.running),
    [timers]
  )

  const hasRunningTimer = runningTimers.length > 0

  const displayTimers = useMemo(() => {
    if (runningTimers.length > 0) return runningTimers
    if (timers.length === 0) return []
    const lastRunningId = lastRunningTimerIdRef.current
    if (lastRunningId !== null) {
      const lastRunningTimer = timers.find((timer) => timer.id === lastRunningId)
      if (lastRunningTimer) return [lastRunningTimer]
    }
    return [timers[0]]
  }, [runningTimers, timers])

  const pausedDisplayTimerId = useMemo(() => {
    if (hasRunningTimer) return null
    const lastRunningId = lastRunningTimerIdRef.current
    if (lastRunningId === null) return null
    return timers.some((timer) => timer.id === lastRunningId) ? lastRunningId : null
  }, [hasRunningTimer, timers])

  useEffect(() => {
    const runningTimer = timers.find((timer) => timer.running)
    if (runningTimer) {
      lastRunningTimerIdRef.current = runningTimer.id
    }
  }, [timers])

  useEffect(() => {
    if (!hasRunningTimer) return

    const interval = window.setInterval(() => {
      setTimers((prev: Timer[]) =>
        prev.map((timer) =>
          timer.running ? { ...timer, elapsed: timer.elapsed + 1 } : timer
        )
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [hasRunningTimer])

  useEffect(() => {
    timersRef.current = timers
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ timers, savedAt: Date.now() }))
    } catch (error) {
      void appendLogEntry(buildLogEntry('error', undefined, {
        source: 'localStorage',
        key: STORAGE_KEY,
        message: String(error)
      }))
    }
  }, [timers])

  useEffect(() => {
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify({ removedTimers, savedAt: Date.now() }))
    } catch (error) {
      void appendLogEntry(buildLogEntry('error', undefined, {
        source: 'localStorage',
        key: HISTORY_KEY,
        message: String(error)
      }))
    }
  }, [removedTimers])

  useEffect(() => {
    void appendLogEntry(buildLogEntry('app_start'))
    if (initLoadErrorRef.current) {
      void appendLogEntry(buildLogEntry('error', undefined, {
        source: 'storage_parse',
        key: STORAGE_KEY,
        message: initLoadErrorRef.current
      }))
      initLoadErrorRef.current = null
    }
  }, [])

  useEffect(() => {
    const handleBeforeUnload = (): void => {
      const snapshot = timersRef.current
      void appendLogEntry(buildLogEntry('summary', undefined, {
        timers: snapshot.map((timer) => ({
          id: timer.id,
          label: timer.label,
          elapsed: timer.elapsed,
          running: timer.running
        }))
      }))
      void appendLogEntry(buildLogEntry('app_exit'))
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  const toggleTimer = (id: number, allowMultiple: boolean): void => {
    setTimers((prev: Timer[]) => {
      const targetTimer = prev.find((timer) => timer.id === id)
      if (!targetTimer) return prev
      const nextRunning = !targetTimer.running
      let target: Timer | null = null
      const nextAction: 'start' | 'pause' = nextRunning ? 'start' : 'pause'
      const next = prev.map((timer) => {
        if (timer.id === id) {
          target = { ...timer, running: nextRunning }
          return { ...timer, running: nextRunning }
        }
        if (nextRunning && !allowMultiple && timer.running) {
          return { ...timer, running: false }
        }
        return timer
      })

      if (target) {
        void appendLogEntry(buildLogEntry(nextAction, target))
      }

      return next
    })
  }

  const resetTimer = (id: number): void => {
    setTimers((prev: Timer[]) => {
      let updatedTimer: Timer | null = null
      let previousElapsed: number | null = null
      const next = prev.map((timer) => {
        if (timer.id !== id) return timer
        previousElapsed = timer.elapsed
        updatedTimer = {
          id: timer.id,
          label: timer.label,
          elapsed: 0,
          running: false
        }
        return updatedTimer
      })

      if (updatedTimer && previousElapsed !== null) {
        void appendLogEntry(buildLogEntry('reset', updatedTimer, {
          previousElapsed
        }))
      }

      return next
    })
  }

  const adjustTimerMinutes = (id: number, minutes: number): void => {
    if (!minutes) return
    const deltaSeconds = minutes * 60
    setTimers((prev: Timer[]) => {
      let updatedTimer: Timer | null = null
      let previousElapsed: number | null = null
      const next = prev.map((timer) => {
        if (timer.id !== id) return timer
        previousElapsed = timer.elapsed
        const nextElapsed = Math.max(0, timer.elapsed + deltaSeconds)
        updatedTimer = {
          id: timer.id,
          label: timer.label,
          elapsed: nextElapsed,
          running: timer.running
        }
        return updatedTimer
      })

      if (updatedTimer && previousElapsed !== null) {
        void appendLogEntry(buildLogEntry('adjust', updatedTimer, {
          previousElapsed,
          deltaMinutes: minutes
        }))
      }

      return next
    })
  }

  const transferTimerMinutes = (sourceId: number, targetId: number, minutes: number): void => {
    if (!minutes) return
    if (sourceId === targetId) return
    const deltaSeconds = minutes * 60
    setTimers((prev: Timer[]) => {
      const sourceTimer = prev.find((timer) => timer.id === sourceId)
      const targetTimer = prev.find((timer) => timer.id === targetId)
      if (!sourceTimer || !targetTimer) return prev
      const availableSeconds = Math.min(deltaSeconds, sourceTimer.elapsed)
      if (availableSeconds <= 0) return prev

      const next = prev.map((timer) => {
        if (timer.id === sourceId) {
          return { ...timer, elapsed: Math.max(0, timer.elapsed - availableSeconds) }
        }
        if (timer.id === targetId) {
          return { ...timer, elapsed: timer.elapsed + availableSeconds }
        }
        return timer
      })

      const updatedSource = next.find((timer) => timer.id === sourceId)
      const updatedTarget = next.find((timer) => timer.id === targetId)
      if (updatedSource && updatedTarget) {
        void appendLogEntry(buildLogEntry('transfer', updatedSource, {
          targetId: updatedTarget.id,
          targetLabel: updatedTarget.label,
          sourcePreviousElapsed: sourceTimer.elapsed,
          targetPreviousElapsed: targetTimer.elapsed,
          deltaMinutes: availableSeconds / 60
        }))
      }

      return next
    })
  }
  const restoreTimerSnapshot = (snapshot: Timer): void => {
    setTimers((prev: Timer[]) => {
      let found = false
      const next = prev.map((timer) => {
        if (timer.id !== snapshot.id) return timer
        found = true
        return { ...snapshot }
      })
      return found ? next : prev
    })
  }

  const removeTimer = (id: number): void => {
    setTimers((prev: Timer[]) => {
      const timerToRemove = prev.find((timer) => timer.id === id)
      if (!timerToRemove) return prev

      const now = Date.now()
      const entry: RemovedTimerEntry = {
        entryId: `${now}-${Math.random().toString(36).slice(2, 8)}`,
        timer: { ...timerToRemove, running: false },
        removedAt: now
      }

      setRemovedTimers((history) => [entry, ...history].slice(0, HISTORY_LIMIT))
      void appendLogEntry(buildLogEntry('remove', timerToRemove))

      return prev.filter((timer) => timer.id !== id)
    })
  }

  const addTimer = (label: string): void => {
    const nextId = Date.now()
    const trimmed = label.trim().slice(0, MAX_LABEL_LENGTH)
    setTimers((prev: Timer[]) => [
      ...prev,
      {
        id: nextId,
        label: trimmed,
        elapsed: 0,
        running: true
      }
    ].map((timer) =>
      timer.id === nextId ? timer : { ...timer, running: false }
    ))
    const newTimer = {
      id: nextId,
      label: trimmed,
      elapsed: 0,
      running: true
    }
    void appendLogEntry(buildLogEntry('add', newTimer))
    void appendLogEntry(buildLogEntry('start', newTimer))
  }

  const renameTimer = (id: number, label: string): void => {
    const nextLabel = label.trim().slice(0, MAX_LABEL_LENGTH)
    setTimers((prev: Timer[]) => {
      let updatedTimer: Timer | null = null
      let previousLabel: string | null = null
      const next = prev.map((timer) => {
        if (timer.id !== id) return timer
        previousLabel = timer.label
        updatedTimer = {
          id: timer.id,
          label: nextLabel,
          elapsed: timer.elapsed,
          running: timer.running
        }
        return updatedTimer
      })

      if (updatedTimer && previousLabel !== null && previousLabel !== nextLabel) {
        void appendLogEntry(buildLogEntry('rename', updatedTimer, {
          previousLabel
        }))
      }

      return next
    })
  }

  const restoreTimer = (entry: RemovedTimerEntry): void => {
    const now = Date.now()
    const idInUse = timers.some((timer) => timer.id === entry.timer.id)
    const nextId = idInUse ? now : entry.timer.id
    const restoredTimer = { ...entry.timer, id: nextId, running: false }
    setTimers((prev: Timer[]) => [...prev, restoredTimer])

    setRemovedTimers((prev) => prev.filter((item) => item.entryId !== entry.entryId))

    void appendLogEntry(buildLogEntry('restore', restoredTimer, {
      originalId: entry.timer.id
    }))
  }

  const reorderTimers = (sourceId: number, targetId: number): void => {
    if (sourceId === targetId) return
    setTimers((prev: Timer[]) => {
      const sourceIndex = prev.findIndex((timer) => timer.id === sourceId)
      const targetIndex = prev.findIndex((timer) => timer.id === targetId)
      if (sourceIndex === -1 || targetIndex === -1) return prev
      const next = [...prev]
      const [moved] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
  }

  const normalizeLabel = (label: string): string => label.trim().toLowerCase()

  const isDuplicateLabel = (label: string, excludeId: number | null = null): boolean => {
    const normalized = normalizeLabel(label)
    if (!normalized) return false
    return timers.some((timer) => timer.id !== excludeId && normalizeLabel(timer.label) === normalized)
  }

  return {
    timers,
    displayTimers,
    removedTimers,
    hasRunningTimer,
    pausedDisplayTimerId,
    toggleTimer,
    resetTimer,
    adjustTimerMinutes,
    transferTimerMinutes,
    restoreTimerSnapshot,
    removeTimer,
    addTimer,
    renameTimer,
    restoreTimer,
    reorderTimers,
    isDuplicateLabel
  }
}
