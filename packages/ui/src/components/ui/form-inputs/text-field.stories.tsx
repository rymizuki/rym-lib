import type { Meta, StoryObj } from '@storybook/react'

import { TextField } from './text-field'

const meta: Meta<typeof TextField> = {
  component: TextField,
}

export default meta
type Story = StoryObj<typeof TextField>

export const Basic: Story = {
  args: {
    label: 'Example',
    defaultValue: 'hello world',
    hint: 'This message is input hint for user.',
  },
}

export const ReadOnly: Story = {
  args: {
    label: 'Example',
    defaultValue: 'hello world',
    readOnly: true,
  },
}
