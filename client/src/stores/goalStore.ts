import { create } from 'zustand'
import { Goal, KeyResult } from '../types'
import { apiClient } from '../services/api'

interface GoalState {
  goals: Goal[]
  selectedGoalId: string | null
  loading: boolean
  error: string | null
}

interface GoalActions {
  loadGoals: (status?: string) => Promise<void>
  loadGoal: (id: string) => Promise<Goal | null>
  createGoal: (
    goal: Omit<
      Goal,
      'id' | 'created_at' | 'updated_at' | 'progress_percentage' | 'key_results'
    >
  ) => Promise<Goal | null>
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<boolean>
  deleteGoal: (id: string) => Promise<boolean>
  createKeyResult: (
    goalId: string,
    kr: Omit<
      KeyResult,
      'id' | 'goal_id' | 'created_at' | 'updated_at' | 'progress_percentage'
    >
  ) => Promise<KeyResult | null>
  updateKeyResultProgress: (
    krId: string,
    currentValue: number
  ) => Promise<boolean>
  setSelectedGoalId: (id: string | null) => void
  linkTaskToGoal: (
    taskId: string,
    goalId: string,
    keyResultId?: string
  ) => Promise<boolean>
  unlinkTaskFromGoal: (taskId: string, goalId: string) => Promise<boolean>
}

type GoalStore = GoalState & GoalActions

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: [],
  selectedGoalId: null,
  loading: false,
  error: null,

  loadGoals: async (status?: string) => {
    try {
      set({ loading: true, error: null })
      const goals = await apiClient.getGoals(status)
      set({ goals, loading: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load goals',
        loading: false,
      })
    }
  },

  loadGoal: async (id: string) => {
    try {
      const goal = await apiClient.getGoal(id)
      if (goal) {
        set(state => ({
          goals: state.goals.some(g => g.id === id)
            ? state.goals.map(g => (g.id === id ? goal : g))
            : [...state.goals, goal],
        }))
      }
      return goal
    } catch {
      return null
    }
  },

  createGoal: async goalData => {
    const { goals } = get()
    try {
      const created = await apiClient.createGoal(goalData)
      set({ goals: [created, ...goals] })
      return created
    } catch {
      return null
    }
  },

  updateGoal: async (id, updates) => {
    const { goals } = get()
    const original = goals.find(g => g.id === id)
    if (!original) return false

    set({ goals: goals.map(g => (g.id === id ? { ...g, ...updates } : g)) })

    try {
      const updated = await apiClient.updateGoal(id, updates)
      set({ goals: get().goals.map(g => (g.id === id ? updated : g)) })
      return true
    } catch {
      set({ goals: get().goals.map(g => (g.id === id ? original : g)) })
      return false
    }
  },

  deleteGoal: async id => {
    const { goals } = get()
    set({ goals: goals.filter(g => g.id !== id) })
    try {
      await apiClient.deleteGoal(id)
      return true
    } catch {
      set({ goals })
      return false
    }
  },

  createKeyResult: async (goalId, krData) => {
    try {
      const kr = await apiClient.createKeyResult(goalId, krData)
      set(state => ({
        goals: state.goals.map(g =>
          g.id === goalId
            ? { ...g, key_results: [...(g.key_results || []), kr] }
            : g
        ),
      }))
      return kr
    } catch {
      return null
    }
  },

  updateKeyResultProgress: async (krId, currentValue) => {
    try {
      const updated = await apiClient.updateKeyResultProgress(
        krId,
        currentValue
      )
      set(state => ({
        goals: state.goals.map(g => ({
          ...g,
          key_results: g.key_results?.map(kr =>
            kr.id === krId ? updated : kr
          ),
        })),
      }))
      return true
    } catch {
      return false
    }
  },

  setSelectedGoalId: id => set({ selectedGoalId: id }),

  linkTaskToGoal: async (taskId, goalId, keyResultId) => {
    try {
      await apiClient.linkTaskToGoal(taskId, goalId, keyResultId)
      return true
    } catch {
      return false
    }
  },

  unlinkTaskFromGoal: async (taskId, goalId) => {
    try {
      await apiClient.unlinkTaskFromGoal(taskId, goalId)
      return true
    } catch {
      return false
    }
  },
}))
