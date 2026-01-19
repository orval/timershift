import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/preact'
import { afterEach, vi } from 'vitest'

const createMemoryStorage = (): Storage => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length
    }
  }
}

const ensureLocalStorage = (): void => {
  // Avoid touching localStorage.getItem to prevent Node webstorage warnings.
  const hasStorage =
    typeof globalThis.localStorage !== 'undefined' &&
    globalThis.localStorage !== null &&
    typeof globalThis.localStorage === 'object' &&
    'getItem' in globalThis.localStorage &&
    'setItem' in globalThis.localStorage &&
    'clear' in globalThis.localStorage
  if (hasStorage) return

  const storage = createMemoryStorage()
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true
  })
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: storage,
      configurable: true
    })
  }
}

ensureLocalStorage()

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children?: unknown }) => children ?? null,
  closestCenter: () => null,
  KeyboardSensor: class {},
  PointerSensor: class {},
  MouseSensor: class {},
  useSensor: () => ({}),
  useSensors: (...args: unknown[]) => args
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children?: unknown }) => children ?? null,
  sortableKeyboardCoordinates: () => null,
  verticalListSortingStrategy: () => null,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => undefined,
    transform: null,
    transition: null,
    isDragging: false
  })
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => ''
    }
  }
}))

afterEach(() => {
  cleanup()
})
