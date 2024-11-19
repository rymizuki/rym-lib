import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { CandidateTextField } from './candidate-text-field'

const meta: Meta<typeof CandidateTextField> = {
  component: CandidateTextField,
}

export default meta
type Story = StoryObj<typeof CandidateTextField>

export const Basic: Story = {
  args: {
    label: 'example list',
    name: 'list',
    defaultValue: { label: 'Example 1', value: '1' },
    loader: async () => {
      return [
        { label: 'Example 0', value: '0' },
        { label: 'Example 1', value: '1' },
        { label: 'Example 2', value: '2' },
      ]
    },
    onChange: fn(),
  },
}
