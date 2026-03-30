import React from 'react'

const BoardIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
)

const DashboardIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
)

const CalendarIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const ListIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
)

const AnalyticsIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

const DependencyIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="5" cy="12" r="3" />
    <circle cx="19" cy="12" r="3" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <polyline points="13 9 16 12 13 15" />
  </svg>
)

interface MobileNavProps {
  currentView:
    | 'board'
    | 'dashboard'
    | 'calendar'
    | 'analytics'
    | 'list'
    | 'dependency'
  onNavigate: (
    view:
      | 'board'
      | 'dashboard'
      | 'calendar'
      | 'analytics'
      | 'list'
      | 'dependency'
  ) => void
}

const MobileNav: React.FC<MobileNavProps> = ({ currentView, onNavigate }) => {
  const navItems = [
    { id: 'board' as const, icon: <BoardIcon />, label: 'Board' },
    { id: 'list' as const, icon: <ListIcon />, label: 'List' },
    { id: 'dashboard' as const, icon: <DashboardIcon />, label: 'Dashboard' },
    { id: 'analytics' as const, icon: <AnalyticsIcon />, label: 'Analytics' },
    {
      id: 'dependency' as const,
      icon: <DependencyIcon />,
      label: 'Dependencies',
    },
    { id: 'calendar' as const, icon: <CalendarIcon />, label: 'Calendar' },
  ]

  return (
    <nav
      className="mobile-nav"
      role="navigation"
      aria-label="Mobile navigation"
    >
      {navItems.map(item => (
        <button
          key={item.id}
          className={`mobile-nav-item ${currentView === item.id ? 'active' : ''}`}
          onClick={() => onNavigate(item.id)}
          aria-current={currentView === item.id ? 'page' : undefined}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default MobileNav
