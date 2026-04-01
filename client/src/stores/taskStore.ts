import { create } from 'zustand'
import { Task, TaskStatus } from '../types'
import { apiClient } from '../services/api'

type SortField = 'created_at' | 'due_date' | 'priority' | 'title'
type SortOrder = 'asc' | 'desc'

interface TaskFilters {
  status?: TaskStatus | 'all'
  priority?: Task['priority'] | 'all'
  dueDate?: 'all' | 'today' | 'week' | 'overdue'
  projectId?: string
}

interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
  action?: { label: string; onClick: () => void }
}

interface TaskState {
  tasks: Task[]
  total: number
  loading: boolean
  loadingMore: boolean
  error: string | null
  filters: TaskFilters
  sortBy: SortField
  sortOrder: SortOrder
  hasMore: boolean
  pendingOptimisticUpdates: Map<string, Task>
  toasts: ToastMessage[]
  selectedTaskId: string | null
  openDialogs: Set<string>
}

interface TaskActions {
  loadTasks: (reset?: boolean) => Promise<void>
  createTask: (
    task: Omit<
      Task,
      'id' | 'created_at' | 'updated_at' | 'workspace_id' | 'creator_id'
    >
  ) => Promise<Task | null>
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<boolean>
  deleteTask: (taskId: string) => Promise<boolean>
  toggleTaskStatus: (taskId: string) => Promise<boolean>
  bulkUpdate: (taskIds: string[], updates: Partial<Task>) => Promise<boolean>
  bulkDelete: (taskIds: string[]) => Promise<boolean>
  setFilters: (filters: Partial<TaskFilters>) => void
  setSortBy: (field: SortField) => void
  setSortOrder: (order: SortOrder) => void
  setSelectedTaskId: (id: string | null) => void
  openDialog: (dialog: string) => void
  closeDialog: (dialog: string) => void
  addToast: (toast: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void
  rollbackOptimisticUpdate: (taskId: string) => void
  getFilteredTasks: () => Task[]
}

type TaskStore = TaskState & TaskActions

const PAGE_SIZE = 50

const applyOptimisticUpdate = (
  tasks: Task[],
  taskId: string,
  updates: Partial<Task>
): Task[] => tasks.map(t => (t.id === taskId ? { ...t, ...updates } : t))

const getNextStatus = (current: TaskStatus): TaskStatus => {
  const order: TaskStatus[] = ['todo', 'in_progress', 'done']
  const currentIndex = order.indexOf(current)
  if (currentIndex === -1) return current
  return order[(currentIndex + 1) % order.length]
}

let toastCounter = 0

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  total: 0,
  loading: false,
  loadingMore: false,
  error: null,
  filters: { status: 'all', priority: 'all', dueDate: 'all' },
  sortBy: 'created_at',
  sortOrder: 'desc',
  hasMore: true,
  pendingOptimisticUpdates: new Map(),
  toasts: [],
  selectedTaskId: null,
  openDialogs: new Set(),

  loadTasks: async (reset = true) => {
    const { filters, sortBy, sortOrder, tasks } = get()
    try {
      set(
        reset
          ? { loading: true, error: null }
          : { loadingMore: true, error: null }
      )
      const params: Parameters<typeof apiClient.getTasks>[0] = {
        limit: PAGE_SIZE,
        offset: reset ? 0 : tasks.length,
        sortBy,
        sortOrder,
      }
      if (filters.status && filters.status !== 'all')
        params.status = filters.status
      if (filters.priority && filters.priority !== 'all')
        params.priority = filters.priority

      const result = await apiClient.getTasks(params)
      set({
        tasks: reset ? result.tasks : [...tasks, ...result.tasks],
        total: result.total,
        hasMore: result.tasks.length === PAGE_SIZE,
        loading: false,
        loadingMore: false,
      })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load tasks',
        loading: false,
        loadingMore: false,
      })
    }
  },

  createTask: async taskData => {
    const { tasks } = get()
    const tempId = `temp-${Date.now()}`
    const optimisticTask = {
      ...taskData,
      id: tempId,
      created_at: new Date(),
      updated_at: new Date(),
    } as Task

    set({ tasks: [optimisticTask, ...tasks] })
    try {
      const created = await apiClient.createTask(taskData)
      set({
        tasks: [created, ...get().tasks.filter(t => t.id !== tempId)],
        total: get().total + 1,
      })
      get().addToast({ type: 'success', message: 'Task created' })
      return created
    } catch {
      set({ tasks: get().tasks.filter(t => t.id !== tempId) })
      get().addToast({ type: 'error', message: 'Failed to create task' })
      return null
    }
  },

  updateTask: async (taskId, updates) => {
    const { tasks, pendingOptimisticUpdates } = get()
    const originalTask = tasks.find(t => t.id === taskId)
    if (!originalTask) return false

    const newPending = new Map(pendingOptimisticUpdates)
    newPending.set(taskId, originalTask)

    set({
      tasks: applyOptimisticUpdate(tasks, taskId, updates),
      pendingOptimisticUpdates: newPending,
    })

    try {
      const updated = await apiClient.updateTask(taskId, updates)
      const currentPending = new Map(get().pendingOptimisticUpdates)
      currentPending.delete(taskId)
      set({
        tasks: get().tasks.map(t => (t.id === taskId ? updated : t)),
        pendingOptimisticUpdates: currentPending,
      })
      return true
    } catch {
      get().rollbackOptimisticUpdate(taskId)
      get().addToast({
        type: 'error',
        message: 'Failed to update task',
        action: {
          label: 'Retry',
          onClick: () => get().updateTask(taskId, updates),
        },
      })
      return false
    }
  },

  deleteTask: async taskId => {
    const { tasks, pendingOptimisticUpdates } = get()
    const originalTask = tasks.find(t => t.id === taskId)
    if (!originalTask) return false

    const newPending = new Map(pendingOptimisticUpdates)
    newPending.set(taskId, originalTask)

    set({
      tasks: tasks.filter(t => t.id !== taskId),
      total: Math.max(0, get().total - 1),
      pendingOptimisticUpdates: newPending,
    })

    try {
      await apiClient.deleteTask(taskId)
      const currentPending = new Map(get().pendingOptimisticUpdates)
      currentPending.delete(taskId)
      set({ pendingOptimisticUpdates: currentPending })
      get().addToast({ type: 'success', message: 'Task deleted' })
      return true
    } catch {
      get().rollbackOptimisticUpdate(taskId)
      get().addToast({ type: 'error', message: 'Failed to delete task' })
      return false
    }
  },

  toggleTaskStatus: async taskId => {
    const { tasks } = get()
    const task = tasks.find(t => t.id === taskId)
    if (!task) return false
    const nextStatus = getNextStatus(task.status)
    return get().updateTask(taskId, { status: nextStatus })
  },

  bulkUpdate: async (taskIds, updates) => {
    const { tasks, pendingOptimisticUpdates } = get()
    const originals = new Map<string, Task>()
    taskIds.forEach(id => {
      const t = tasks.find(task => task.id === id)
      if (t) originals.set(id, t)
    })

    const newPending = new Map(pendingOptimisticUpdates)
    originals.forEach((task, id) => newPending.set(id, task))

    set({
      tasks: tasks.map(t =>
        taskIds.includes(t.id) ? { ...t, ...updates } : t
      ),
      pendingOptimisticUpdates: newPending,
    })

    try {
      const updated = await apiClient.bulkUpdateTasks(taskIds, updates)
      const currentPending = new Map(get().pendingOptimisticUpdates)
      originals.forEach((_, id) => currentPending.delete(id))
      set({
        tasks: get().tasks.map(t => {
          const u = updated.find(ut => ut.id === t.id)
          return u || t
        }),
        pendingOptimisticUpdates: currentPending,
      })
      get().addToast({
        type: 'success',
        message: `${taskIds.length} tasks updated`,
      })
      return true
    } catch {
      originals.forEach((_, id) => {
        get().rollbackOptimisticUpdate(id)
      })
      get().addToast({ type: 'error', message: 'Bulk update failed' })
      return false
    }
  },

  bulkDelete: async taskIds => {
    const { tasks, pendingOptimisticUpdates } = get()
    const originals = new Map<string, Task>()
    taskIds.forEach(id => {
      const t = tasks.find(task => task.id === id)
      if (t) originals.set(id, t)
    })

    const newPending = new Map(pendingOptimisticUpdates)
    originals.forEach((task, id) => newPending.set(id, task))

    set({
      tasks: tasks.filter(t => !taskIds.includes(t.id)),
      total: Math.max(0, get().total - taskIds.length),
      pendingOptimisticUpdates: newPending,
    })

    try {
      await apiClient.bulkDeleteTasks(taskIds)
      const currentPending = new Map(get().pendingOptimisticUpdates)
      originals.forEach((_, id) => currentPending.delete(id))
      set({ pendingOptimisticUpdates: currentPending })
      get().addToast({
        type: 'success',
        message: `${taskIds.length} tasks deleted`,
      })
      return true
    } catch {
      originals.forEach((_, id) => {
        get().rollbackOptimisticUpdate(id)
      })
      get().addToast({ type: 'error', message: 'Bulk delete failed' })
      return false
    }
  },

  setFilters: filters =>
    set(state => ({ filters: { ...state.filters, ...filters } })),

  setSortBy: field => {
    const { sortBy, sortOrder } = get()
    if (field === sortBy) {
      set({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })
    } else {
      set({ sortBy: field, sortOrder: 'asc' })
    }
    get().loadTasks(true)
  },

  setSortOrder: order => set({ sortOrder: order }),

  setSelectedTaskId: id => set({ selectedTaskId: id }),

  openDialog: dialog =>
    set(state => {
      const next = new Set(state.openDialogs)
      next.add(dialog)
      return { openDialogs: next }
    }),

  closeDialog: dialog =>
    set(state => {
      const next = new Set(state.openDialogs)
      next.delete(dialog)
      return { openDialogs: next }
    }),

  addToast: toast => {
    const id = `toast-${++toastCounter}`
    set(state => ({ toasts: [...state.toasts, { ...toast, id }] }))
    setTimeout(() => get().removeToast(id), 5000)
  },

  removeToast: id =>
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),

  rollbackOptimisticUpdate: taskId => {
    const { pendingOptimisticUpdates } = get()
    const original = pendingOptimisticUpdates.get(taskId)
    if (!original) return
    set({
      tasks: get().tasks.map(t => (t.id === taskId ? original : t)),
      pendingOptimisticUpdates: (() => {
        const next = new Map(pendingOptimisticUpdates)
        next.delete(taskId)
        return next
      })(),
    })
  },

  getFilteredTasks: () => {
    const { tasks, filters, sortBy, sortOrder } = get()
    let filtered = tasks.filter(task => {
      if (
        filters.status &&
        filters.status !== 'all' &&
        task.status !== filters.status
      )
        return false
      if (
        filters.priority &&
        filters.priority !== 'all' &&
        task.priority !== filters.priority
      )
        return false
      if (filters.dueDate && filters.dueDate !== 'all' && task.due_date) {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const taskDate = new Date(
          new Date(task.due_date).getFullYear(),
          new Date(task.due_date).getMonth(),
          new Date(task.due_date).getDate()
        )
        if (
          filters.dueDate === 'today' &&
          taskDate.getTime() !== today.getTime()
        )
          return false
        if (filters.dueDate === 'week') {
          const weekEnd = new Date(today)
          weekEnd.setDate(weekEnd.getDate() + 7)
          if (taskDate < today || taskDate > weekEnd) return false
        }
        if (filters.dueDate === 'overdue' && taskDate >= today) return false
      }
      if (
        filters.dueDate !== 'all' &&
        filters.dueDate !== 'overdue' &&
        !task.due_date
      )
        return false
      return true
    })

    filtered.sort((a, b) => {
      let cmp = 0
      switch (sortBy) {
        case 'priority': {
          const order = { critical: 0, high: 1, medium: 2, low: 3 }
          cmp = order[a.priority] - order[b.priority]
          break
        }
        case 'due_date':
          cmp =
            (a.due_date ? new Date(a.due_date).getTime() : Infinity) -
            (b.due_date ? new Date(b.due_date).getTime() : Infinity)
          break
        case 'title':
          cmp = (a.title || '').localeCompare(b.title || '')
          break
        default:
          cmp =
            (a.created_at ? new Date(a.created_at).getTime() : 0) -
            (b.created_at ? new Date(b.created_at).getTime() : 0)
      }
      return sortOrder === 'asc' ? cmp : -cmp
    })

    return filtered
  },
}))
