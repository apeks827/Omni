import type { Meta, StoryObj } from '@storybook/react'
import Badge from './Badge'

const meta = {
  title: 'Design System/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'danger', 'warning', 'info'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    children: 'Primary',
    variant: 'primary',
  },
}

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
}

export const Success: Story = {
  args: {
    children: 'Success',
    variant: 'success',
  },
}

export const Danger: Story = {
  args: {
    children: 'Danger',
    variant: 'danger',
  },
}

export const Warning: Story = {
  args: {
    children: 'Warning',
    variant: 'warning',
  },
}

export const Info: Story = {
  args: {
    children: 'Info',
    variant: 'info',
  },
}

export const Small: Story = {
  args: {
    children: 'Small',
    size: 'sm',
  },
}

export const Medium: Story = {
  args: {
    children: 'Medium',
    size: 'md',
  },
}
