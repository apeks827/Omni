import React from 'react'
import { useTheme } from '../hooks/useTheme'
import { colors, spacing } from '../design-system'

const SunIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)

const MoonIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

const SystemIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
)

interface ThemeToggleProps {
  className?: string
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    const next: 'light' | 'dark' | 'system' =
      theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    setTheme(next)
  }

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <SunIcon />
      case 'dark':
        return <MoonIcon />
      case 'system':
        return <SystemIcon />
    }
  }

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light'
      case 'dark':
        return 'Dark'
      case 'system':
        return 'System'
    }
  }

  const getTooltip = () => {
    const next: 'light' | 'dark' | 'system' =
      theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    return `Theme: ${getLabel()} (click to switch to ${next})`
  }

  return (
    <button
      onClick={toggleTheme}
      title={getTooltip()}
      aria-label={getTooltip()}
      style={{
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: '6px',
        padding: spacing.xs,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.gray600,
        transition: 'color 0.15s ease, background-color 0.15s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = colors.gray200
        e.currentTarget.style.color = colors.gray900
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = 'transparent'
        e.currentTarget.style.color = colors.gray600
      }}
      className={className}
    >
      {getIcon()}
    </button>
  )
}

export default ThemeToggle
