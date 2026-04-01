import { create } from 'zustand'

interface ViewState {
  view: 'list' | 'board' | 'dashboard' | 'calendar' | 'analytics' | 'dependency'
  showFeedbackWidget: boolean
  setView: (
    view:
      | 'list'
      | 'board'
      | 'dashboard'
      | 'calendar'
      | 'analytics'
      | 'dependency'
  ) => void
  setShowFeedbackWidget: (show: boolean) => void
}

export const useViewStore = create<ViewState>(set => ({
  view: 'board',
  showFeedbackWidget: false,
  setView: view => set({ view }),
  setShowFeedbackWidget: show => set({ showFeedbackWidget: show }),
}))
