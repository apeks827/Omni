import type { Meta, StoryObj } from '@storybook/react'
import Button from './Button'

const meta = {
  title: 'Design System/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'primary',
        'secondary',
        'success',
        'danger',
        'warning',
        'outline',
        'ghost',
      ],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    isLoading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
}

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
}

export const Success: Story = {
  args: {
    children: 'Success Button',
    variant: 'success',
  },
}

export const Danger: Story = {
  args: {
    children: 'Danger Button',
    variant: 'danger',
  },
}

export const Warning: Story = {
  args: {
    children: 'Warning Button',
    variant: 'warning',
  },
}

export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
}

export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
}

export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm',
  },
}

export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'lg',
  },
}

export const Loading: Story = {
  args: {
    children: 'Loading Button',
    isLoading: true,
  },
}

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
}
