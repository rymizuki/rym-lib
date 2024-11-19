import type { Meta, StoryObj } from '@storybook/react'

import { TextareaField } from './textarea-field'

const meta: Meta<typeof TextareaField> = {
  component: TextareaField,
}

export default meta
type Story = StoryObj<typeof TextareaField>

export const Basic: Story = {
  args: {
    label: 'Example',
    rows: 12,
    hint: 'This text was hint for user.',
  },
}

export const ReadOnly: Story = {
  args: {
    label: 'Example',
    rows: 12,
    hint: 'This text was hint for user.',
    defaultValue: `Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. `,
    readOnly: true,
  },
}
