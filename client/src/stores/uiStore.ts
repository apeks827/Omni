import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type View =
  | 'list'
  | 'board'
  | 'dashboard'
  | 'calendar'
  | 'analytics'
  | 'dependency'
  | 'goals'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  action?: { label: string; onClick: () => void }
}

interface UIState {
  view: View
  sidebarOpen: boolean
  toasts: Toast[]
  modalStack: string[]
  activeContextPanel: string | null
  theme: 'light' | 'dark'
  compactMode: boolean
}

interface UIActions {
  setView: (view: View) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  openModal: (modal: string) => void
  closeModal: () => void
  closeAllModals: () => void
  setActiveContextPanel: (panel: string | null) => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleCompactMode: () => void
}

type UIStore = UIState & UIActions

let toastCounter = 0

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      view: 'board',
      sidebarOpen: true,
      toasts: [],
      modalStack: [],
      activeContextPanel: null,
      theme: 'light',
      compactMode: false,

      setView: view => set({ view }),
      toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: sidebarOpen => set({ sidebarOpen }),

      addToast: toast => {
        const id = `toast-${++toastCounter}`
        set(s => ({ toasts: [...s.toasts, { ...toast, id }] }))
        setTimeout(() => get().removeToast(id), 5000)
      },

      removeToast: id =>
        set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

      openModal: modal => set(s => ({ modalStack: [...s.modalStack, modal] })),

      closeModal: () => set(s => ({ modalStack: s.modalStack.slice(0, -1) })),

      closeAllModals: () => set({ modalStack: [] }),

      setActiveContextPanel: panel => set({ activeContextPanel: panel }),

      setTheme: theme => {
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
      },

      toggleCompactMode: () => set(s => ({ compactMode: !s.compactMode })),
    }),
    {
      name: 'omni-ui-preferences',
      partialize: state => ({
        theme: state.theme,
        compactMode: state.compactMode,
        view: state.view,
      }),
    }
  )
)
