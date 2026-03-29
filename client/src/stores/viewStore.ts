import { create } from 'zustand'

interface ViewState {
  view: 'list' | 'board' | 'dashboard'
  showFeedbackWidget: boolean
  setView: (view: 'list' | 'board' | 'dashboard') => void
  setShowFeedbackWidget: (show: boolean) => void
}

export const useViewStore = create<ViewState>(set => ({
  view: 'board',
  showFeedbackWidget: false,
  setView: view => set({ view }),
  setShowFeedbackWidget: show => set({ showFeedbackWidget: show }),
}))
