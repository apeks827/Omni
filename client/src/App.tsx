import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import { useViewStore } from './stores/viewStore'
import TaskList from './components/TaskList'
import TaskBoardContainer from './components/TaskBoardContainer'
import Dashboard from './components/Dashboard'
import FeedbackWidget from './components/FeedbackWidget'
import { Text, Button, colors, spacing } from './design-system'

// Define the main App component with routing
const AppContent: React.FC = () => {
  const { view, showFeedbackWidget, setShowFeedbackWidget, setView } =
    useViewStore()

  const feedbackContext = {
    page: window.location.pathname,
    sessionId: localStorage.getItem('sessionId') || 'anonymous',
    appVersion: 'v1.0.0',
  }

  return (
    <>
      <header
        style={{
          backgroundColor: colors.bg.subtle,
          padding: spacing.lg,
          borderBottom: `1px solid ${colors.border.subtle}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <Text variant="h1" style={{ margin: 0 }}>
            Omni Task Manager
          </Text>
          <Text
            variant="body"
            color="gray600"
            style={{ marginTop: spacing.xs }}
          >
            Welcome to the best in the world task manager
          </Text>
        </div>
        <div style={{ display: 'flex', gap: spacing.md, alignItems: 'center' }}>
          <div
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
              variant={view === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              style={{
                backgroundColor: view === 'list' ? colors.white : 'transparent',
                color: view === 'list' ? colors.dark : colors.gray700,
                boxShadow:
                  view === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              List
            </Button>
            <Button
              variant={view === 'dashboard' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setView('dashboard')}
              style={{
                backgroundColor: view === 'dashboard' ? colors.white : 'transparent',
                color: view === 'dashboard' ? colors.dark : colors.gray700,
                boxShadow:
                  view === 'dashboard' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Dashboard
            </Button>
          </div>
          <Button onClick={() => setShowFeedbackWidget(true)}>Feedback</Button>
        </div>
      </header>
      <main style={{ minHeight: 'calc(100vh - 100px)' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/board" replace />} />
          <Route path="/board" element={<TaskBoardContainer />} />
          <Route path="/list" element={<TaskList />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/board" replace />} />
        </Routes>
      </main>
      <FeedbackWidget
        isOpen={showFeedbackWidget}
        onClose={() => setShowFeedbackWidget(false)}
        page={feedbackContext.page}
        sessionId={feedbackContext.sessionId}
        appVersion={feedbackContext.appVersion}
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
