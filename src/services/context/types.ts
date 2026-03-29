export interface ContextService {
  updateContext(userId: string, signals: Record<string, unknown>): Promise<void>
  getCurrentContext(userId: string): Promise<ContextSnapshot>
}

export interface ContextSnapshot {
  location?: string
  device?: string
  energy_level?: 'low' | 'medium' | 'high'
  active_routine?: string
  timestamp: Date
}
