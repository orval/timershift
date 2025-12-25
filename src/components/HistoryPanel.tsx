import type { JSX } from 'preact'
import type { RemovedTimerEntry } from '../types'
import { formatTime, formatTimestamp } from '../utils/time'

type HistoryPanelProps = {
  removedTimers: RemovedTimerEntry[]
  onClose: () => void
  onRestore: (entry: RemovedTimerEntry) => void
}

export const HistoryPanel = ({ removedTimers, onClose, onRestore }: HistoryPanelProps): JSX.Element => {
  return (
    <section class='history-panel'>
      <div class='history-header'>
        <h2 class='history-title'>History</h2>
        <div class='history-actions'>
          <button
            class='ghost-btn history-restore-btn'
            type='button'
            onClick={onClose}
          >
            Hide
          </button>
        </div>
      </div>
      {removedTimers.length === 0 ? (
        <p class='history-empty'>No removed timers yet</p>
      ) : (
        <ul class='history-list'>
          {removedTimers.map((entry) => (
            <li class='history-item' key={entry.entryId}>
              <div class='history-meta'>
                <p class='history-name'>{entry.timer.label}</p>
                <p class='history-time'>
                  Removed {formatTimestamp(entry.removedAt)} - {formatTime(entry.timer.elapsed)}
                </p>
              </div>
              <button
                class='ghost-btn history-restore-btn'
                type='button'
                onClick={() => onRestore(entry)}
              >
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
