import type { Meta, StoryObj } from '@storybook/react'

import { Icon } from './icon'

const meta: Meta<typeof Icon> = {
  component: Icon,
}

export default meta
type Story = StoryObj<typeof Icon>

export const Basic: Story = {
  args: {
    name: 'plus',
  },
}
