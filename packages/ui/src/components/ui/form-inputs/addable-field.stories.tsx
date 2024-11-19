import type { Meta, StoryObj } from '@storybook/react'

import { AddableField } from './addable-field'
import { TextField } from './text-field'

const meta: Meta<typeof AddableField> = {
  component: AddableField,
}

export default meta
type Story = StoryObj<typeof AddableField>

export const Basic: Story = {
  args: {
    children: () => <TextField />,
    defaultValue: [],
    name: 'example',
  },
}
