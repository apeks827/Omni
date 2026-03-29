export const formatRelativeDate = (date: Date | string): string => {
  const targetDate = typeof date === 'string' ? new Date(date) : date
  const now = new Date()

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  )
  const startOfTargetDay = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  )

  const diffMs = startOfTargetDay.getTime() - startOfToday.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
  if (diffDays <= 7) return `In ${diffDays} days`

  return targetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year:
      targetDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

export const isOverdue = (date: Date | string): boolean => {
  const targetDate = typeof date === 'string' ? new Date(date) : date
  const now = new Date()

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  )
  const startOfTargetDay = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  )

  return startOfTargetDay < startOfToday
}

export const getDateColor = (date: Date | string): string => {
  if (isOverdue(date)) return '#d32f2f'

  const targetDate = typeof date === 'string' ? new Date(date) : date
  const now = new Date()

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  )
  const startOfTargetDay = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  )

  const diffMs = startOfTargetDay.getTime() - startOfToday.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '#1976d2'
  if (diffDays === 1) return '#388e3c'
  if (diffDays <= 3) return '#f57c00'

  return '#666'
}
