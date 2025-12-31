import type { LogEntry, Timer } from '../types'

const LOG_FILE = 'timershift-history.jsonl'

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

const getLogPath = async (): Promise<{ appDir: string, logPath: string } | null> => {
  try {
    const { appDataDir, join } = await import('@tauri-apps/api/path')
    const appDir = await appDataDir()
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
