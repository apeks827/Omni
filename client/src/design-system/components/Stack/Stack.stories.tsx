import type { Meta, StoryObj } from '@storybook/react'
import Stack from './Stack'
import Card from '../Card/Card'

const meta = {
  title: 'Design System/Stack',
  component: Stack,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
    spacing: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end', 'stretch', 'baseline'],
    },
    justify: {
      control: 'select',
      options: ['start', 'center', 'end', 'between', 'around', 'evenly'],
    },
  },
} satisfies Meta<typeof Stack>

export default meta
type Story = StoryObj<typeof meta>

export const Vertical: Story = {
  args: {
    direction: 'vertical',
    spacing: 'md',
    children: (
      <>
        <Card padding="sm">Item 1</Card>
        <Card padding="sm">Item 2</Card>
        <Card padding="sm">Item 3</Card>
      </>
    ),
  },
}

export const Horizontal: Story = {
  args: {
    direction: 'horizontal',
    spacing: 'md',
    children: (
      <>
        <Card padding="sm">Item 1</Card>
        <Card padding="sm">Item 2</Card>
        <Card padding="sm">Item 3</Card>
      </>
    ),
  },
}

export const SmallSpacing: Story = {
  args: {
    direction: 'vertical',
    spacing: 'sm',
    children: (
      <>
        <Card padding="sm">Item 1</Card>
        <Card padding="sm">Item 2</Card>
        <Card padding="sm">Item 3</Card>
      </>
    ),
  },
}

export const LargeSpacing: Story = {
  args: {
    direction: 'vertical',
    spacing: 'lg',
    children: (
      <>
        <Card padding="sm">Item 1</Card>
        <Card padding="sm">Item 2</Card>
        <Card padding="sm">Item 3</Card>
      </>
    ),
  },
}

export const CenterAligned: Story = {
  args: {
    direction: 'vertical',
    spacing: 'md',
    align: 'center',
    children: (
      <>
        <Card padding="sm">Short</Card>
        <Card padding="sm">Medium length item</Card>
        <Card padding="sm">Very long item with more content</Card>
      </>
    ),
  },
}
