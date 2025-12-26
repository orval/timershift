import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/preact'
import { afterEach, vi } from 'vitest'

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
