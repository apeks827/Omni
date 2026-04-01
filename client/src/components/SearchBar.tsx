import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchStore } from '../stores/searchStore'
import { colors, spacing } from '../design-system'

interface SearchBarProps {
  onSearch: (query: string) => void
  onSuggestions: (partialQuery: string) => void
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onSuggestions }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localQuery, setLocalQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { setQuery, isOpen, isLoading, suggestions, closeSearch } =
    useSearchStore()

  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      debounceRef.current = setTimeout(() => {
        if (value.length > 0) {
          onSearch(value)
          onSuggestions(value)
        }
      }, 300)
    },
    [onSearch, onSuggestions]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        useSearchStore.getState().openSearch()
      }
      if (e.key === '/' && !isOpen) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          useSearchStore.getState().openSearch()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalQuery(value)
    setQuery(value)
    debouncedSearch(value)
  }

  const handleClear = () => {
    setLocalQuery('')
    setQuery('')
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(localQuery)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => useSearchStore.getState().openSearch()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          padding: `${spacing.sm} ${spacing.md}`,
          backgroundColor: colors.bg.subtle,
          border: `1px solid ${colors.border.default}`,
          borderRadius: '8px',
          cursor: 'pointer',
          color: colors.text.secondary,
          fontSize: '14px',
          minWidth: '240px',
        }}
      >
        <span>Search tasks...</span>
        <kbd
          style={{
            padding: '2px 6px',
            backgroundColor: colors.bg.default,
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}
        >
          Cmd+K
        </kbd>
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ position: 'relative', width: '100%' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: colors.white,
          border: `2px solid ${colors.primary}`,
          borderRadius: '8px',
          padding: `${spacing.sm} ${spacing.md}`,
          gap: spacing.sm,
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.text.secondary}
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={handleChange}
          placeholder="Search tasks..."
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '16px',
            backgroundColor: 'transparent',
          }}
        />
        {isLoading && (
          <div
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid',
              borderColor: `${colors.primary} transparent ${colors.primary} transparent`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        )}
        {localQuery && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              padding: '4px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={colors.text.secondary}
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
        <kbd
          onClick={closeSearch}
          style={{
            padding: '2px 6px',
            backgroundColor: colors.bg.subtle,
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            cursor: 'pointer',
          }}
        >
          ESC
        </kbd>
      </div>

      {suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            backgroundColor: colors.white,
            border: `1px solid ${colors.border.default}`,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 100,
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setLocalQuery(suggestion)
                setQuery(suggestion)
                onSearch(suggestion)
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: `${spacing.sm} ${spacing.md}`,
                border: 'none',
                background: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = colors.bg.subtle
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  )
}

export default SearchBar
