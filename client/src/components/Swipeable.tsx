import React, { useRef, useState } from 'react'

interface SwipeableProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  leftAction?: { label: string; color: string }
  rightAction?: { label: string; color: string }
  threshold?: number
}

const Swipeable: React.FC<SwipeableProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  threshold = 50,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(
    null
  )
  const [startX, setStartX] = useState(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX)
    containerRef.current?.classList.add('swiping')
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startX) return

    const currentX = e.touches[0].clientX
    const diff = currentX - startX

    if (diff < -threshold && onSwipeLeft) {
      setSwipeDirection('left')
    } else if (diff > threshold && onSwipeRight) {
      setSwipeDirection('right')
    } else {
      setSwipeDirection(null)
    }
  }

  const handleTouchEnd = () => {
    if (swipeDirection === 'left' && onSwipeLeft) {
      onSwipeLeft()
    } else if (swipeDirection === 'right' && onSwipeRight) {
      onSwipeRight()
    }

    setSwipeDirection(null)
    setStartX(0)
    containerRef.current?.classList.remove('swiping')
  }

  return (
    <div
      ref={containerRef}
      className={`swipe-container ${
        swipeDirection ? `swiping-${swipeDirection}` : ''
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {leftAction && (
        <div className="swipe-actions left">
          <div
            className="swipe-action complete"
            style={{ backgroundColor: leftAction.color }}
          >
            {leftAction.label}
          </div>
        </div>
      )}
      {rightAction && (
        <div className="swipe-actions right">
          <div
            className="swipe-action delete"
            style={{ backgroundColor: rightAction.color }}
          >
            {rightAction.label}
          </div>
        </div>
      )}
      <div className="swipe-content">{children}</div>
    </div>
  )
}

export default Swipeable
