import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { Dialog } from './dialog'

const meta: Meta<typeof Dialog> = {
  component: Dialog,
}

export default meta
type Story = StoryObj<typeof Dialog>

export const Basic: Story = {
  args: {
    backdrop: true,
    modal: true,
    title: 'Example',
    children: <div>example</div>,
    actions: {
      cancel: 'Cancel',
      submit: 'Submit',
    },
    onCancel: fn(),
    onClose: fn(),
    onSubmit: fn(),
  },
}
