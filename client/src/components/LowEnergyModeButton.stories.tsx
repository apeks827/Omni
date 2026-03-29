import type { Meta, StoryObj } from '@storybook/react'
import LowEnergyModeButton from './LowEnergyModeButton'

const meta = {
  title: 'Components/LowEnergyModeButton',
  component: LowEnergyModeButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LowEnergyModeButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onToggle: enabled => console.log('Low energy mode:', enabled),
    initialEnabled: false,
  },
}

export const Enabled: Story = {
  args: {
    onToggle: enabled => console.log('Low energy mode:', enabled),
    initialEnabled: true,
  },
}
