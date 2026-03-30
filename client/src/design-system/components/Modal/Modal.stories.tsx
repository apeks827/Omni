import type { Meta } from '@storybook/react'
import Modal from './Modal'
import Button from '../Button/Button'
import { useState } from 'react'

const meta = {
  title: 'Design System/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Modal Title',
    children: <p>Modal content goes here.</p>,
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Modal>

export default meta

const InteractiveWrapper = (props: {
  title?: string
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={props.title}
        footer={props.footer}
        size={props.size}
      >
        {props.children}
      </Modal>
    </>
  )
}

export const Default = {
  render: () => (
    <InteractiveWrapper title="Modal Title">
      <p>Modal content goes here.</p>
    </InteractiveWrapper>
  ),
}

export const WithFooter = {
  render: () => (
    <InteractiveWrapper
      title="Confirm Action"
      footer={
        <>
          <Button variant="outline">Cancel</Button>
          <Button variant="danger">Delete</Button>
        </>
      }
    >
      <p>Are you sure you want to delete this item?</p>
    </InteractiveWrapper>
  ),
}

export const SmallSize = {
  render: () => (
    <InteractiveWrapper title="Small Modal" size="sm">
      <p>This is a small modal.</p>
    </InteractiveWrapper>
  ),
}

export const LargeSize = {
  render: () => (
    <InteractiveWrapper title="Large Modal" size="lg">
      <p>This is a large modal with more content space.</p>
      <p>You can add more content here.</p>
    </InteractiveWrapper>
  ),
}
