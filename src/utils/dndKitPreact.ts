import type { ComponentChildren, ComponentType } from 'preact'
import { DndContext as DndContextBase, type DndContextProps } from '@dnd-kit/core'
import { SortableContext as SortableContextBase, type SortableContextProps } from '@dnd-kit/sortable'

type PreactDndContextProps = Omit<DndContextProps, 'children'> & { children?: ComponentChildren }
type PreactSortableContextProps = Omit<SortableContextProps, 'children'> & { children?: ComponentChildren }

export const DndContext = DndContextBase as unknown as ComponentType<PreactDndContextProps>
export const SortableContext = SortableContextBase as unknown as ComponentType<PreactSortableContextProps>
