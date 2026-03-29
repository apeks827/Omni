import React from 'react'
import { spacing } from '../../tokens'

interface StackProps {
  children: React.ReactNode
  direction?: 'horizontal' | 'vertical'
  spacing?: keyof typeof spacing
  wrap?: boolean
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  style?: React.CSSProperties
}

const Stack: React.FC<StackProps> = ({
  children,
  direction = 'vertical',
  spacing: spacingValue = 'md',
  wrap = false,
  align = 'start',
  justify = 'start',
  style,
}) => {
  const flexDirection = direction === 'horizontal' ? 'row' : 'column'
  const gapValue = spacing[spacingValue]

  const alignMap: Record<string, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
    baseline: 'baseline',
  }

  const justifyMap: Record<string, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around',
    evenly: 'space-evenly',
  }

  const baseStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection,
    gap: gapValue,
    flexWrap: wrap ? 'wrap' : 'nowrap',
    alignItems: alignMap[align],
    justifyContent: justifyMap[justify],
    ...style,
  }

  return <div style={baseStyles}>{children}</div>
}

export default Stack
