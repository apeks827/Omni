import React, { useState, useEffect } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom'
import { useViewStore } from './stores/viewStore'
import TaskList from './components/TaskList'
import TaskBoardContainer from './components/TaskBoardContainer'
import DependencyGraph from './components/DependencyGraph'
import Dashboard from './components/Dashboard'
import Analytics from './components/Analytics'
import CalendarView from './components/CalendarView'
import ScheduleView from './components/ScheduleView'
import FeedbackWidget from './components/FeedbackWidget'
import MobileNav from './components/MobileNav'
import PWAInstallBanner from './components/PWAInstallBanner'
import { OnboardingFlow } from './components/Onboarding'
import { useOnboarding } from './hooks/useOnboarding'
import { useAuth } from './hooks/useAuth'
import AuthScreen from './components/AuthScreen'
import NotificationBell from './components/NotificationBell'
import NotificationPreferences from './pages/NotificationPreferences'
import QuickCaptureWidget from './components/QuickCaptureWidget'
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal'
import ShortcutSettings from './components/ShortcutSettings'
import { Text, Button, colors, spacing } from './design-system'
import { shortcutManager } from './services/shortcutManager'
import { DEFAULT_SHORTCUTS } from './services/shortcutsRegistry'

// Define the main App component with routing
const AppContent: React.FC = () => {
  const { view, showFeedbackWidget, setShowFeedbackWidget, setView } =
    useViewStore()
  const [isMobile, setIsMobile] = useState(false)
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding()
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const [showShortcutsSettings, setShowShortcutsSettings] = useState(false)
  const navigate = useNavigate()

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text variant="body" color="gray600">
          Loading...
        </Text>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={() => {}} />
  }

  useEffect(() => {
    shortcutManager.initialize()
    DEFAULT_SHORTCUTS.forEach(s => shortcutManager.register(s))
    shortcutManager.load()

    return () => {
      shortcutManager.destroy()
    }
  }, [])

  useEffect(() => {
    const handleShortcut = (e: unknown) => {
      const event = e as {
        detail: {
          action: string
          target?: string
          direction?: string
          level?: string
        }
      }
      const { action, target } = event.detail

      switch (action) {
        case 'help':
          setShowShortcutsHelp(true)
          break
        case 'escape':
          setShowShortcutsHelp(false)
          setShowShortcutsSettings(false)
          setShowFeedbackWidget(false)
          break
        case 'view': {
          if (target === 'board') setView('board')
          else if (target === 'list') setView('list')
          else if (target === 'calendar') setView('calendar')
          else if (target === 'dashboard') setView('dashboard')
          break
        }
        case 'go': {
          if (target === 'tasks') navigate('/board')
          else if (target === 'calendar') navigate('/calendar')
          else if (target === 'dashboard') navigate('/dashboard')
          break
        }
        case 'search': {
          const searchInput = document.querySelector(
            'input[type="search"]'
          ) as HTMLInputElement
          if (searchInput) searchInput.focus()
          break
        }
      }
    }

    document.addEventListener('omni:shortcut', handleShortcut)
    return () => document.removeEventListener('omni:shortcut', handleShortcut)
  }, [setView, setShowFeedbackWidget, navigate])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const feedbackContext = {
    page: window.location.pathname,
    sessionId: localStorage.getItem('sessionId') || 'anonymous',
    appVersion: 'v1.0.0',
  }

  const handleMobileNavigate = (
    newView:
      | 'board'
      | 'dashboard'
      | 'calendar'
      | 'analytics'
      | 'list'
      | 'dependency'
  ) => {
    setView(newView)
    const path = newView === 'board' ? '/board' : `/${newView}`
    window.history.pushState({}, '', path)
  }

  if (showOnboarding) {
    return (
      <OnboardingFlow onComplete={completeOnboarding} onSkip={skipOnboarding} />
    )
  }

  return (
    <>
      <PWAInstallBanner />
      <header
        style={{
          backgroundColor: 'var(--bg-subtle)',
          padding: spacing.lg,
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <Text
            variant="h1"
            style={{ margin: 0, color: 'var(--text-primary)' }}
          >
            Omni
          </Text>
          <Text
            variant="body"
            color="gray600"
            style={{ marginTop: spacing.xs, color: 'var(--text-secondary)' }}
          >
            Best task manager
          </Text>
        </div>
        <div
          className="desktop-nav header-actions"
          style={{ display: 'flex', gap: spacing.md, alignItems: 'center' }}
        >
          <NotificationBell />
          <div
            className="view-toggle"
            style={{
              backgroundColor: colors.gray200,
              padding: spacing.xs,
              borderRadius: '6px',
              display: 'flex',
              gap: spacing.xs,
            }}
          >
            <Button
              variant={view === 'board' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setView('board')}
              style={{
                backgroundColor:
                  view === 'board' ? colors.white : 'transparent',
                color: view === 'board' ? colors.dark : colors.gray700,
                boxShadow:
                  view === 'board' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Board
            </Button>
            <Button
              variant={view === 'dashboard' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setView('dashboard')}
              style={{
                backgroundColor:
                  view === 'dashboard' ? colors.white : 'transparent',
                color: view === 'dashboard' ? colors.dark : colors.gray700,
                boxShadow:
                  view === 'dashboard' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Dashboard
            </Button>
            <Button
              variant={view === 'calendar' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setView('calendar')}
              style={{
                backgroundColor:
                  view === 'calendar' ? colors.white : 'transparent',
                color: view === 'calendar' ? colors.dark : colors.gray700,
                boxShadow:
                  view === 'calendar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Calendar
            </Button>
            <Button
              variant={view === 'analytics' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setView('analytics')}
              style={{
                backgroundColor:
                  view === 'analytics' ? colors.white : 'transparent',
                color: view === 'analytics' ? colors.dark : colors.gray700,
                boxShadow:
                  view === 'analytics' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Analytics
            </Button>
            <Button
              variant={view === 'dependency' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setView('dependency')}
              style={{
                backgroundColor:
                  view === 'dependency' ? colors.white : 'transparent',
                color: view === 'dependency' ? colors.dark : colors.gray700,
                boxShadow:
                  view === 'dependency' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Dependencies
            </Button>
          </div>
          <Button onClick={() => setShowFeedbackWidget(true)}>Feedback</Button>
        </div>
      </header>
      <main style={{ minHeight: 'calc(100vh - 100px)' }}>
        {isMobile ? (
          <>
            {view === 'board' && <TaskBoardContainer />}
            {view === 'list' && <TaskList />}
            {view === 'dashboard' && <Dashboard />}
            {view === 'analytics' && <Analytics />}
            {view === 'calendar' && <CalendarView />}
            {view === 'dependency' && <DependencyGraph tasks={[]} />}
          </>
        ) : (
          <Routes>
            <Route path="/" element={<Navigate to="/board" replace />} />
            <Route path="/board" element={<TaskBoardContainer />} />
            <Route path="/list" element={<TaskList />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/schedule" element={<ScheduleView />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route
              path="/dependency"
              element={<DependencyGraph tasks={[]} />}
            />
            <Route
              path="/settings/notifications"
              element={<NotificationPreferences />}
            />
            <Route path="*" element={<Navigate to="/board" replace />} />
          </Routes>
        )}
      </main>
      <MobileNav currentView={view} onNavigate={handleMobileNavigate} />
      <QuickCaptureWidget />
      <FeedbackWidget
        isOpen={showFeedbackWidget}
        onClose={() => setShowFeedbackWidget(false)}
        page={feedbackContext.page}
        sessionId={feedbackContext.sessionId}
        appVersion={feedbackContext.appVersion}
      />
      <KeyboardShortcutsModal
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
        shortcuts={DEFAULT_SHORTCUTS.map(s => ({
          key: s.key,
          description: s.description,
          category: s.category,
        }))}
      />
      <ShortcutSettings
        isOpen={showShortcutsSettings}
        onClose={() => setShowShortcutsSettings(false)}
      />
    </>
  )
}

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <AppContent />
      </div>
    </Router>
  )
}

export default App
