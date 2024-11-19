import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { Alert } from './alert'

const meta: Meta<typeof Alert> = {
  component: Alert,
}

export default meta
type Story = StoryObj<typeof Alert>

export const Success: Story = {
  args: {
    type: 'success',
    children: <div>This is message, "hello world!"</div>,
    title: 'Message',
  },
}

export const Danger: Story = {
  args: {
    type: 'danger',
    children: <div>This is error message</div>,
    title: 'Error',
  },
}

export const Closable: Story = {
  args: {
    type: 'success',
    children: <div>This is message, "hello world!"</div>,
    title: 'Message',
    closable: true,
    onClose: fn(),
  },
}
