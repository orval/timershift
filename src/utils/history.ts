import type { HistoryLogEntry, Timer } from '../types'

const HISTORY_LOG_FILE = 'timershift-history.jsonl'

export const buildLogEntry = (
  action: HistoryLogEntry['action'],
  timer?: Timer,
  metadata?: Record<string, unknown>
): HistoryLogEntry => ({
  action,
  timerId: timer?.id,
  label: timer?.label,
  elapsed: timer?.elapsed,
  at: Date.now(),
  metadata
})

const getHistoryLogPath = async (): Promise<{ appDir: string, logPath: string } | null> => {
  try {
    const { appDataDir, join } = await import('@tauri-apps/api/path')
    const appDir = await appDataDir()
    const logPath = await join(appDir, HISTORY_LOG_FILE)
    return { appDir, logPath }
  } catch {
    return null
  }
}

export const appendHistoryLog = async (entry: HistoryLogEntry): Promise<void> => {
  try {
    const paths = await getHistoryLogPath()
    if (!paths) return
    const { createDir, readTextFile, writeTextFile } = await import('@tauri-apps/api/fs')
    await createDir(paths.appDir, { recursive: true })
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
