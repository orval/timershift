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
    <section className='flex flex-col gap-lg rounded-md border border-white-mid bg-panel-bg px-md py-sm shadow-panel'>
      <div className='flex items-baseline justify-between gap-xs'>
        <h2 className='m-0 text-md font-bold text-text-bright'>History</h2>
        <div className='inline-flex items-center gap-xs'>
          <button
            className='whitespace-nowrap rounded-md border border-white-mid bg-white-low px-sm py-xs text-sm font-semibold text-text-button transition-[background,color,transform] duration-150 hover:bg-white-mid hover:text-text-bright active:translate-y-px'
            type='button'
            onClick={onClose}
          >
            Hide
          </button>
        </div>
      </div>
      {removedTimers.length === 0 ? (
        <p className='m-0 text-sm text-text-muted'>No removed timers yet</p>
      ) : (
        <ul className='m-0 flex list-none flex-col gap-xs p-0'>
          {removedTimers.map((entry) => (
            <li
              className='flex items-center justify-between gap-lg rounded-md border border-white-mid bg-white-low px-sm py-xs'
              key={entry.entryId}
            >
              <div className='flex min-w-0 flex-col gap-0.5'>
                <p className='m-0 max-w-full truncate text-md font-semibold text-text-label'>
                  {entry.timer.label}
                </p>
                <p className='m-0 text-sm text-text-muted'>
                  Removed {formatTimestamp(entry.removedAt)} - {formatTime(entry.timer.elapsed)}
                </p>
              </div>
              <button
                className='whitespace-nowrap rounded-md border border-white-mid bg-white-low px-sm py-xs text-sm font-semibold text-text-button transition-[background,color,transform] duration-150 hover:bg-white-mid hover:text-text-bright active:translate-y-px'
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
