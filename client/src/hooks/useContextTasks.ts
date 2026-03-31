import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../services/api'
import { contextService, Context } from '../services/contextDetection'
import { Task } from '../types'

interface UseContextTasksOptions {
  limit?: number
  offset?: number
  status?: string
  priority?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseContextTasksResult {
  tasks: Task[]
  total: number
  isLoading: boolean
  error: Error | null
  context: Context | null
  refetch: () => Promise<void>
  showContextOnly: boolean
  setShowContextOnly: (show: boolean) => void
}

export function useContextTasks(
  options: UseContextTasksOptions = {}
): UseContextTasksResult {
  const {
    limit = 20,
    offset = 0,
    status,
    priority,
    autoRefresh = true,
    refreshInterval = 60000,
  } = options

  const [tasks, setTasks] = useState<Task[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [context, setContext] = useState<Context | null>(
    contextService.getContext()
  )
  const [showContextOnly, setShowContextOnly] = useState(false)

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const currentContext = contextService.getContext()
      setContext(currentContext)

      if (showContextOnly && currentContext) {
        const result = await apiClient.getContextAwareTasks({
          limit,
          offset,
          status,
          priority,
          context_device: currentContext.device.type,
          context_time_of_day: currentContext.time.timeOfDay,
        })
        setTasks(result.tasks)
        setTotal(result.total)
      } else {
        const result = await apiClient.getTasks({
          limit,
          offset,
          status,
          priority,
          context_device: currentContext?.device.type,
          context_time_of_day: currentContext?.time.timeOfDay,
        })
        setTasks(result.tasks)
        setTotal(result.total)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tasks'))
    } finally {
      setIsLoading(false)
    }
  }, [limit, offset, status, priority, showContextOnly])

  useEffect(() => {
    const unsubscribe = contextService.subscribe(newContext => {
      setContext(newContext)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    if (!autoRefresh) return

    const intervalId = setInterval(() => {
      fetchTasks()
    }, refreshInterval)

    return () => clearInterval(intervalId)
  }, [autoRefresh, refreshInterval, fetchTasks])

  return {
    tasks,
    total,
    isLoading,
    error,
    context,
    refetch: fetchTasks,
    showContextOnly,
    setShowContextOnly,
  }
}

export function useTaskContext(task: Task | null): {
  contextScore: number
  contextMatch: {
    device: boolean
    timeOfDay: boolean
    tags: boolean
  }
  matchedTags: string[]
} {
  const context = contextService.getContext()

  if (!task || !context) {
    return {
      contextScore: 0,
      contextMatch: { device: false, timeOfDay: false, tags: false },
      matchedTags: [],
    }
  }

  const deviceMatch =
    !task.preferred_device?.length ||
    task.preferred_device.includes(context.device.type)

  const timeMatch =
    !task.preferred_time_of_day?.length ||
    task.preferred_time_of_day.includes(context.time.timeOfDay)

  const matchedTags =
    task.context_tags?.filter(tag => (context ? true : false)) || []

  const tagMatch = matchedTags.length > 0

  let contextScore = 0
  if (deviceMatch && timeMatch) {
    contextScore = 100
  } else if (deviceMatch || timeMatch) {
    contextScore = 75
  } else if (
    !task.preferred_device?.length &&
    !task.preferred_time_of_day?.length
  ) {
    contextScore = 50
  } else {
    contextScore = 0
  }

  return {
    contextScore,
    contextMatch: {
      device: deviceMatch,
      timeOfDay: timeMatch,
      tags: tagMatch,
    },
    matchedTags,
  }
}
