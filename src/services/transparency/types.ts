export interface TransparencyService {
  explain(decisionId: string): Promise<DecisionExplanation>
  logDecision(decision: Record<string, unknown>): Promise<void>
}

export interface DecisionExplanation {
  summary: string
  factors: string[]
  alternatives_considered: string[]
}
