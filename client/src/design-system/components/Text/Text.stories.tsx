import type { Meta, StoryObj } from '@storybook/react'
import Text from './Text'

const meta = {
  title: 'Design System/Text',
  component: Text,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'body',
        'caption',
        'overline',
      ],
    },
    color: {
      control: 'select',
      options: [
        'primary',
        'secondary',
        'success',
        'danger',
        'warning',
        'info',
        'light',
        'dark',
        'white',
        'gray600',
      ],
    },
    weight: {
      control: 'select',
      options: ['normal', 'medium', 'semibold', 'bold'],
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right', 'justify'],
    },
  },
} satisfies Meta<typeof Text>

export default meta
type Story = StoryObj<typeof meta>

export const Heading1: Story = {
  args: {
    children: 'Heading 1',
    variant: 'h1',
  },
}

export const Heading2: Story = {
  args: {
    children: 'Heading 2',
    variant: 'h2',
  },
}

export const Heading3: Story = {
  args: {
    children: 'Heading 3',
    variant: 'h3',
  },
}

export const Body: Story = {
  args: {
    children: 'This is body text with normal weight and size.',
    variant: 'body',
  },
}

export const Caption: Story = {
  args: {
    children: 'This is caption text, smaller and lighter.',
    variant: 'caption',
  },
}

export const Overline: Story = {
  args: {
    children: 'Overline text',
    variant: 'overline',
  },
}

export const ColoredText: Story = {
  args: {
    children: 'Primary colored text',
    color: 'primary',
  },
}

export const BoldText: Story = {
  args: {
    children: 'Bold text',
    weight: 'bold',
  },
}

export const CenteredText: Story = {
  args: {
    children: 'Centered text',
    align: 'center',
  },
}

export const TruncatedText: Story = {
  args: {
    children:
      'This is a very long text that will be truncated with ellipsis when it exceeds the container width',
    truncate: true,
  },
}
