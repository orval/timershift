import type { LogEntry, RemovedTimerEntry, Timer } from '../types'

const LOG_FILE = 'timershift-history.jsonl'
const HISTORY_BACKUP_FILE = 'timershift-history-backup.json'
const TIMERS_BACKUP_FILE = 'timershift-timers-backup.json'

export const buildLogEntry = (
  action: LogEntry['action'],
  timer?: Timer,
  metadata?: Record<string, unknown>
): LogEntry => ({
  action,
  timerId: timer?.id,
  label: timer?.label,
  elapsed: timer?.elapsed,
  at: Date.now(),
  metadata
})

const getAppDir = async (): Promise<string | null> => {
  try {
    const { appDataDir } = await import('@tauri-apps/api/path')
    return await appDataDir()
  } catch {
    return null
  }
}

const getLogPath = async (): Promise<{ appDir: string, logPath: string } | null> => {
  try {
    const appDir = await getAppDir()
    if (!appDir) return null
    const { join } = await import('@tauri-apps/api/path')
    const logPath = await join(appDir, LOG_FILE)
    return { appDir, logPath }
  } catch {
    return null
  }
}

export const appendLogEntry = async (entry: LogEntry): Promise<void> => {
  try {
    const paths = await getLogPath()
    if (!paths) return
    const { mkdir, readTextFile, writeTextFile } = await import('@tauri-apps/plugin-fs')
    await mkdir(paths.appDir, { recursive: true })
    const line = `${JSON.stringify(entry)}\n`
    let existing = ''
    try {
      existing = await readTextFile(paths.logPath)
    } catch {
      // No prior log file.
    }
    await writeTextFile(paths.logPath, `${existing}${line}`)
  } catch {
    // Logging is best-effort; ignore failures.
  }
}

export type HistoryBackup = {
  removedTimers: RemovedTimerEntry[]
  savedAt: number
}

export type TimersBackup = {
  timers: Timer[]
  savedAt: number
}

export const readHistoryBackup = async (): Promise<HistoryBackup | null> => {
  try {
    const appDir = await getAppDir()
    if (!appDir) return null
    const { join } = await import('@tauri-apps/api/path')
    const { readTextFile } = await import('@tauri-apps/plugin-fs')
    const backupPath = await join(appDir, HISTORY_BACKUP_FILE)
    const raw = await readTextFile(backupPath)
    const parsed = JSON.parse(raw) as Partial<HistoryBackup>
    if (!Array.isArray(parsed.removedTimers)) return null
    return {
      removedTimers: parsed.removedTimers,
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : 0
    }
  } catch {
    return null
  }
}

export const writeHistoryBackup = async (removedTimers: RemovedTimerEntry[]): Promise<void> => {
  try {
    const appDir = await getAppDir()
    if (!appDir) return
    const { join } = await import('@tauri-apps/api/path')
    const { mkdir, writeTextFile } = await import('@tauri-apps/plugin-fs')
    await mkdir(appDir, { recursive: true })
    const backupPath = await join(appDir, HISTORY_BACKUP_FILE)
    await writeTextFile(backupPath, JSON.stringify({ removedTimers, savedAt: Date.now() }))
  } catch {
    // Backup is best-effort; ignore failures.
  }
}


export const readTimersBackup = async (): Promise<TimersBackup | null> => {
  try {
    const appDir = await getAppDir()
    if (!appDir) return null
    const { join } = await import('@tauri-apps/api/path')
    const { readTextFile } = await import('@tauri-apps/plugin-fs')
    const backupPath = await join(appDir, TIMERS_BACKUP_FILE)
    const raw = await readTextFile(backupPath)
    const parsed = JSON.parse(raw) as Partial<TimersBackup>
    if (!Array.isArray(parsed.timers)) return null
    return {
      timers: parsed.timers,
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : 0
    }
  } catch {
    return null
  }
}

export const writeTimersBackup = async (timers: Timer[]): Promise<void> => {
  try {
    const appDir = await getAppDir()
    if (!appDir) return
    const { join } = await import('@tauri-apps/api/path')
    const { mkdir, writeTextFile } = await import('@tauri-apps/plugin-fs')
    await mkdir(appDir, { recursive: true })
    const backupPath = await join(appDir, TIMERS_BACKUP_FILE)
    await writeTextFile(backupPath, JSON.stringify({ timers, savedAt: Date.now() }))
  } catch {
    // Backup is best-effort; ignore failures.
  }
}
