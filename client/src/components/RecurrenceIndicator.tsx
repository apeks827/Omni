import { RecurrenceRule } from '../types'
import { colors } from '../design-system/tokens'

interface RecurrenceIndicatorProps {
  rule: RecurrenceRule
  size?: 'sm' | 'md'
}

export default function RecurrenceIndicator({
  rule,
  size = 'sm',
}: RecurrenceIndicatorProps) {
  const iconSize = size === 'sm' ? '12px' : '16px'
  const fontSize = size === 'sm' ? '10px' : '12px'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: size === 'sm' ? '2px 6px' : '4px 8px',
        backgroundColor: colors.gray100,
        borderRadius: '12px',
        fontSize,
        color: colors.gray700,
        fontWeight: 500,
      }}
      title={getTooltip(rule)}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
      {getLabel(rule)}
    </span>
  )
}

function getLabel(rule: RecurrenceRule): string {
  switch (rule.frequency) {
    case 'daily':
      return 'Daily'
    case 'weekly':
      if (rule.days_of_week && rule.days_of_week.length > 0) {
        const days = rule.days_of_week
          .map(d => d.charAt(0).toUpperCase() + d.slice(1, 3))
          .join(', ')
        return days
      }
      return 'Weekly'
    case 'monthly':
      return 'Monthly'
    case 'custom': {
      const interval = rule.interval || 1
      return `Every ${interval}d`
    }
    default:
      return 'Repeats'
  }
}

function getTooltip(rule: RecurrenceRule): string {
  let tooltip = `${rule.frequency.charAt(0).toUpperCase() + rule.frequency.slice(1)} recurring`

  if (rule.frequency === 'weekly' && rule.days_of_week?.length) {
    tooltip += ` on ${rule.days_of_week.join(', ')}`
  }

  if (rule.end_type === 'count' && rule.end_count) {
    tooltip += `. Ends after ${rule.end_count} occurrences`
  } else if (rule.end_type === 'until' && rule.end_date) {
    tooltip += `. Ends on ${new Date(rule.end_date).toLocaleDateString()}`
  } else {
    tooltip += '. Never ends'
  }

  return tooltip
}
