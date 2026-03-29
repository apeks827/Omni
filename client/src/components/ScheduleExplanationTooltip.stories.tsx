import type { Meta, StoryObj } from '@storybook/react'
import ScheduleExplanationTooltip from './ScheduleExplanationTooltip'

const meta = {
  title: 'Components/ScheduleExplanationTooltip',
  component: ScheduleExplanationTooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ScheduleExplanationTooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    taskId: 'task-123',
    onAccept: () => console.log('Accepted'),
    onReject: () => console.log('Rejected'),
    onManualEdit: (time) => console.log('Manual edit:', time),
  },
}
