import type { Meta, StoryObj } from '@storybook/react'
import Card from './Card'

const meta = {
  title: 'Design System/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    padding: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
    },
    shadow: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    borderRadius: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'full'],
    },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <p>This is a default card with medium padding and small shadow.</p>
    ),
  },
}

export const SmallPadding: Story = {
  args: {
    children: <p>Card with small padding.</p>,
    padding: 'sm',
  },
}

export const LargePadding: Story = {
  args: {
    children: <p>Card with large padding.</p>,
    padding: 'lg',
  },
}

export const MediumShadow: Story = {
  args: {
    children: <p>Card with medium shadow.</p>,
    shadow: 'md',
  },
}

export const LargeShadow: Story = {
  args: {
    children: <p>Card with large shadow.</p>,
    shadow: 'lg',
  },
}

export const RoundedCorners: Story = {
  args: {
    children: <p>Card with large border radius.</p>,
    borderRadius: 'lg',
  },
}
