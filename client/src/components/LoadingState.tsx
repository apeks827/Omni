import React from 'react'
import { Card, Stack } from '../design-system'
import { spacing } from '../design-system/tokens'

interface LoadingStateProps {
  count?: number
}

export const LoadingState: React.FC<LoadingStateProps> = ({ count = 3 }) => {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: spacing.lg }}>
      <Stack direction="vertical" spacing="md">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} padding="md">
            <div
              style={{
                height: '20px',
                width: '60%',
                backgroundColor: '#e0e0e0',
                borderRadius: '4px',
                marginBottom: spacing.sm,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <div
              style={{
                height: '14px',
                width: '40%',
                backgroundColor: '#f0f0f0',
                borderRadius: '4px',
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: '0.2s',
              }}
            />
          </Card>
        ))}
      </Stack>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  )
}

export default LoadingState
