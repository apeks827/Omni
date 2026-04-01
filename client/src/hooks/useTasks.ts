import { useEffect, useCallback } from 'react'
import { useTaskStore } from '../stores/taskStore'

export const useTasks = () => {
  const store = useTaskStore()

  useEffect(() => {
    store.loadTasks(true)
  }, [])

  const loadMore = useCallback(() => {
    if (!store.loadingMore && store.hasMore) {
      store.loadTasks(false)
    }
  }, [store.loadingMore, store.hasMore])

  const createTask = useCallback(
    async (task: Parameters<typeof store.createTask>[0]) => {
      return store.createTask(task)
    },
    [store]
  )

  const updateTask = useCallback(
    async (taskId: string, updates: Parameters<typeof store.updateTask>[1]) => {
      return store.updateTask(taskId, updates)
    },
    [store]
  )

  const deleteTask = useCallback(
    async (taskId: string) => store.deleteTask(taskId),
    [store]
  )

  const toggleStatus = useCallback(
    async (taskId: string) => store.toggleTaskStatus(taskId),
    [store]
  )

  const bulkUpdate = useCallback(
    async (
      taskIds: string[],
      updates: Parameters<typeof store.bulkUpdate>[1]
    ) => store.bulkUpdate(taskIds, updates),
    [store]
  )

  const bulkDelete = useCallback(
    async (taskIds: string[]) => store.bulkDelete(taskIds),
    [store]
  )

  const filteredTasks = store.getFilteredTasks()

  return {
    tasks: store.tasks,
    filteredTasks,
    total: store.total,
    loading: store.loading,
    loadingMore: store.loadingMore,
    hasMore: store.hasMore,
    error: store.error,
    filters: store.filters,
    sortBy: store.sortBy,
    sortOrder: store.sortOrder,
    selectedTaskId: store.selectedTaskId,
    pendingUpdates: store.pendingOptimisticUpdates,
    toasts: store.toasts,
    loadTasks: (reset?: boolean) => store.loadTasks(reset),
    loadMore,
    createTask,
    updateTask,
    deleteTask,
    toggleStatus,
    bulkUpdate,
    bulkDelete,
    setFilters: store.setFilters,
    setSortBy: store.setSortBy,
    setSortOrder: store.setSortOrder,
    setSelectedTaskId: store.setSelectedTaskId,
    openDialog: store.openDialog,
    closeDialog: store.closeDialog,
    addToast: store.addToast,
    removeToast: store.removeToast,
  }
}
