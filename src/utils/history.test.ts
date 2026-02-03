import { describe, expect, test, vi, beforeEach } from 'vitest'
import {
  appendLogEntry,
  readHistoryBackup,
  readTimersBackup,
  writeHistoryBackup,
  writeTimersBackup
} from './history'

const files = new Map<string, string>()

const mockJoin = (...parts: string[]) => parts.join('/')

vi.mock('@tauri-apps/api/path', () => ({
  appDataDir: vi.fn().mockResolvedValue('/app/data'),
  join: vi.fn((...parts: string[]) => mockJoin(...parts))
}))

vi.mock('@tauri-apps/plugin-fs', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  readTextFile: vi.fn((path: string) => {
    if (!files.has(path)) {
      throw new Error('ENOENT')
    }
    return files.get(path) as string
  }),
  writeTextFile: vi.fn((path: string, contents: string) => {
    files.set(path, contents)
  })
}))

beforeEach(() => {
  files.clear()
  vi.clearAllMocks()
})

describe('history backups', () => {
  test('writes and reads history backup', async () => {
    await writeHistoryBackup([
      { entryId: 'e1', removedAt: 1, timer: { id: 1, label: 'T1', elapsed: 5, running: false, type: 'Case' } }
    ])

    const backup = await readHistoryBackup()
    expect(backup?.removedTimers).toHaveLength(1)
  })

  test('returns null when history backup is missing or invalid', async () => {
    expect(await readHistoryBackup()).toBeNull()
    files.set('/app/data/timershift-history-backup.json', '{')
    expect(await readHistoryBackup()).toBeNull()
  })
})

describe('timers backups', () => {
  test('writes and reads timers backup', async () => {
    await writeTimersBackup([
      { id: 2, label: 'T2', elapsed: 10, running: false, type: 'Case' }
    ])

    const backup = await readTimersBackup()
    expect(backup?.timers).toHaveLength(1)
  })

  test('returns null when timers backup is missing or invalid', async () => {
    expect(await readTimersBackup()).toBeNull()
    files.set('/app/data/timershift-timers-backup.json', '{')
    expect(await readTimersBackup()).toBeNull()
  })
})

describe('appendLogEntry', () => {
  test('appends to the JSONL log file', async () => {
    files.set('/app/data/timershift-history.jsonl', '{"action":"start"}\n')
    await appendLogEntry({ action: 'pause', at: 123 })
    const contents = files.get('/app/data/timershift-history.jsonl')
    expect(contents).toContain('"action":"start"')
    expect(contents).toContain('"action":"pause"')
  })

  test('creates the log file if missing', async () => {
    await appendLogEntry({ action: 'app_start', at: 123 })
    const contents = files.get('/app/data/timershift-history.jsonl')
    expect(contents).toContain('"action":"app_start"')
  })
})
