import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { SelectField } from './select-field'

const meta: Meta<typeof SelectField> = {
  component: SelectField,
}

export default meta
type Story = StoryObj<typeof SelectField>

export const Basic: Story = {
  args: {
    options: [
      { label: 'Example 1', value: '1' },
      { label: 'Example 2', value: '2' },
      { label: 'Example 3', value: '3' },
    ],
    onChange: fn(),
    onBlur: fn(),
  },
}
