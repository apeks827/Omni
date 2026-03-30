import { create } from 'zustand'

interface SelectionState {
  selectedTaskIds: Set<string>
  lastSelectedId: string | null
  toggleSelection: (taskId: string) => void
  rangeSelect: (taskId: string, allTaskIds: string[]) => void
  selectAll: (taskIds: string[]) => void
  clearSelection: () => void
  isSelected: (taskId: string) => boolean
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedTaskIds: new Set(),
  lastSelectedId: null,

  toggleSelection: (taskId: string) => {
    set(state => {
      const newSelected = new Set(state.selectedTaskIds)
      if (newSelected.has(taskId)) {
        newSelected.delete(taskId)
      } else {
        newSelected.add(taskId)
      }
      return { selectedTaskIds: newSelected, lastSelectedId: taskId }
    })
  },

  rangeSelect: (taskId: string, allTaskIds: string[]) => {
    const { lastSelectedId } = get()
    if (!lastSelectedId) {
      get().toggleSelection(taskId)
      return
    }

    const startIdx = allTaskIds.indexOf(lastSelectedId)
    const endIdx = allTaskIds.indexOf(taskId)

    if (startIdx === -1 || endIdx === -1) {
      get().toggleSelection(taskId)
      return
    }

    const [start, end] =
      startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx]
    const rangeIds = allTaskIds.slice(start, end + 1)

    set(state => {
      const newSelected = new Set(state.selectedTaskIds)
      rangeIds.forEach(id => newSelected.add(id))
      return { selectedTaskIds: newSelected, lastSelectedId: taskId }
    })
  },

  selectAll: (taskIds: string[]) => {
    set({ selectedTaskIds: new Set(taskIds), lastSelectedId: null })
  },

  clearSelection: () => {
    set({ selectedTaskIds: new Set(), lastSelectedId: null })
  },

  isSelected: (taskId: string) => {
    return get().selectedTaskIds.has(taskId)
  },
}))
