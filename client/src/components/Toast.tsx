import React, { useEffect, useState } from 'react'
import { Text, Button } from '../design-system'

interface ToastProps {
  message: string
  actionLabel?: string
  onAction?: () => void
  onDismiss: () => void
  duration?: number
}

const Toast: React.FC<ToastProps> = ({
  message,
  actionLabel = 'Undo',
  onAction,
  onDismiss,
  duration = 5000,
}) => {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      if (remaining === 0) {
        clearInterval(interval)
        onDismiss()
      }
    }, 50)

    return () => clearInterval(interval)
  }, [duration, onDismiss])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#333',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 1001,
        minWidth: '300px',
      }}
    >
      <Text variant="body" style={{ color: 'white', flex: 1 }}>
        {message}
      </Text>
      {onAction && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onAction}
          style={{ color: '#4ade80' }}
        >
          {actionLabel}
        </Button>
      )}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '3px',
          backgroundColor: '#4ade80',
          width: `${progress}%`,
          borderRadius: '0 0 8px 8px',
          transition: 'width 50ms linear',
        }}
      />
    </div>
  )
}

export default Toast
