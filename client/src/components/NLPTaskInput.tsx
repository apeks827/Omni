import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Input, Badge, Stack, Text } from '../design-system'
import { colors, spacing } from '../design-system/tokens'

export interface ParsedTask {
  title: string
  due_date?: string
  due_time?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  location?: string
  category?: string
  confidence: Record<string, number>
}

export interface NLPTaskInputProps {
  onSubmit: (parsed: ParsedTask) => void
  placeholder?: string
  debounceMs?: number
}

const NLPTaskInput: React.FC<NLPTaskInputProps> = ({
  onSubmit,
  placeholder = 'Add a task... (e.g., "Meeting with team tomorrow at 2pm high priority")',
  debounceMs = 300,
}) => {
  const [input, setInput] = useState('')
  const [parsedPreview, setParsedPreview] = useState<ParsedTask | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortControllerRef = useRef<globalThis.AbortController | null>(null)

  const extractTaskData = useCallback(async (text: string) => {
    if (!text.trim() || text.length < 3) {
      setParsedPreview(null)
      setIsExtracting(false)
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new globalThis.AbortController()

    setIsExtracting(true)
    setError(null)
    setIsTyping(false)

    try {
      const response = await fetch('/api/tasks/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error('Failed to extract task data')
      }

      const data = await response.json()

      if (data && data.title) {
        setParsedPreview({
          title: data.title || text,
          due_date: data.due_date,
          due_time: data.due_time,
          priority: data.priority || 'medium',
          location: data.location,
          category: data.category,
          confidence: data.confidence || {},
        })
      } else {
        setParsedPreview({
          title: text,
          priority: 'medium',
          confidence: {},
        })
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      setError(err instanceof Error ? err.message : 'Extraction failed')
      setParsedPreview(null)
    } finally {
      setIsExtracting(false)
    }
  }, [])

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value)
      setIsTyping(true)
      setError(null)

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        extractTaskData(value)
      }, debounceMs)
    },
    [extractTaskData, debounceMs]
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      if (!parsedPreview?.title?.trim()) {
        setError('Please enter a valid task')
        return
      }

      if (!parsedPreview || Object.keys(parsedPreview.confidence).length > 0) {
        const avgConfidence =
          Object.values(parsedPreview.confidence || {}).reduce(
            (a, b) => a + b,
            0
          ) / Math.max(Object.keys(parsedPreview.confidence || {}).length, 1)

        if (
          avgConfidence < 0.5 &&
          Object.keys(parsedPreview.confidence || {}).length > 0
        ) {
          onSubmit({
            ...parsedPreview,
            title: parsedPreview.title,
          })
          return
        }
      }

      onSubmit(parsedPreview)
    },
    [parsedPreview, onSubmit]
  )

  const handleClear = useCallback(() => {
    setInput('')
    setParsedPreview(null)
    setError(null)
    setIsTyping(false)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const getPriorityColor = (
    priority: 'low' | 'medium' | 'high' | 'critical'
  ) => {
    switch (priority) {
      case 'low':
        return colors.secondary
      case 'medium':
        return colors.info
      case 'high':
        return colors.warning
      case 'critical':
        return colors.danger
      default:
        return colors.secondary
    }
  }

  const formatConfidence = (value: number): string => {
    return `${Math.round(value * 100)}%`
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack direction="vertical" spacing="sm">
        <div style={{ position: 'relative' }}>
          <Input
            type="text"
            value={input}
            onChange={e => handleInputChange(e.target.value)}
            placeholder={placeholder}
            fullWidth
            aria-label="Natural language task input"
          />
          {isTyping && input.length > 0 && !isExtracting && !parsedPreview && (
            <span
              style={{
                position: 'absolute',
                right: spacing.md,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '0.75rem',
                color: colors.gray500,
              }}
            >
              Waiting...
            </span>
          )}
        </div>

        {isExtracting && (
          <Stack direction="horizontal" spacing="xs" align="center">
            <span
              style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                border: `2px solid ${colors.primary}`,
                borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <Text
              variant="body"
              color="gray600"
              style={{ fontSize: '0.875rem' }}
            >
              Analyzing...
            </Text>
          </Stack>
        )}

        {error && (
          <Stack direction="horizontal" spacing="sm" align="center">
            <Text
              variant="body"
              style={{ color: colors.danger, fontSize: '0.875rem' }}
            >
              {error}
            </Text>
            <button
              type="button"
              onClick={() => extractTaskData(input)}
              style={{
                background: 'none',
                border: 'none',
                color: colors.primary,
                cursor: 'pointer',
                fontSize: '0.875rem',
                textDecoration: 'underline',
              }}
            >
              Retry
            </button>
          </Stack>
        )}

        {parsedPreview && !isExtracting && (
          <div
            style={{
              backgroundColor: colors.gray100,
              border: `1px solid ${colors.gray200}`,
              borderRadius: '8px',
              padding: spacing.md,
            }}
          >
            <Stack direction="vertical" spacing="sm">
              <Text
                variant="body"
                style={{ fontWeight: 600, fontSize: '0.875rem' }}
              >
                Preview
              </Text>

              <Text variant="body" style={{ fontSize: '0.875rem' }}>
                <strong>Title:</strong> {parsedPreview.title}
              </Text>

              <Stack direction="horizontal" spacing="sm" wrap>
                {parsedPreview.priority && (
                  <Badge
                    variant="info"
                    style={{
                      backgroundColor: getPriorityColor(parsedPreview.priority),
                    }}
                  >
                    {parsedPreview.priority}
                  </Badge>
                )}
                {parsedPreview.due_date && (
                  <Badge variant="secondary">
                    {new Date(parsedPreview.due_date).toLocaleDateString()}
                  </Badge>
                )}
                {parsedPreview.due_time && (
                  <Badge variant="secondary">{parsedPreview.due_time}</Badge>
                )}
                {parsedPreview.location && (
                  <Badge variant="info">{parsedPreview.location}</Badge>
                )}
                {parsedPreview.category && (
                  <Badge variant="warning">{parsedPreview.category}</Badge>
                )}
              </Stack>

              {Object.keys(parsedPreview.confidence).length > 0 && (
                <Stack direction="horizontal" spacing="sm" wrap>
                  {Object.entries(parsedPreview.confidence).map(
                    ([field, conf]) => (
                      <span
                        key={field}
                        style={{
                          fontSize: '0.75rem',
                          color:
                            conf >= 0.7
                              ? colors.success
                              : conf >= 0.5
                                ? colors.warning
                                : colors.danger,
                        }}
                      >
                        {field}: {formatConfidence(conf as number)}
                      </span>
                    )
                  )}
                </Stack>
              )}

              <Stack
                direction="horizontal"
                spacing="sm"
                style={{ marginTop: spacing.sm }}
              >
                <button
                  type="submit"
                  disabled={!parsedPreview.title?.trim()}
                  style={{
                    padding: `${spacing.sm} ${spacing.md}`,
                    backgroundColor: colors.primary,
                    color: colors.white,
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  Review & Create
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  style={{
                    padding: `${spacing.sm} ${spacing.md}`,
                    backgroundColor: 'transparent',
                    color: colors.gray600,
                    border: `1px solid ${colors.gray300}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Clear
                </button>
              </Stack>
            </Stack>
          </div>
        )}
      </Stack>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </form>
  )
}

export default NLPTaskInput
