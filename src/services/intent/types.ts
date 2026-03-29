export interface IntentService {
  process(input: string, userId: string): Promise<StructuredIntent>
}

export interface StructuredIntent {
  type: 'task' | 'habit' | 'routine'
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  due_date?: Date
  estimated_duration?: number
  context_signals?: Record<string, unknown>
}
