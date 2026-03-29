export interface SchedulingService {
  rebalance(userId: string): Promise<ScheduleResult>
  resolveConflict(conflictId: string): Promise<void>
}

export interface ScheduleResult {
  updated_slots: Array<Record<string, unknown>>
  conflicts: Array<Record<string, unknown>>
  efficiency_score: number
}
