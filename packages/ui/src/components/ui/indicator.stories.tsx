import type { Meta, StoryObj } from '@storybook/react'

import { Indicator } from './indicator'

const meta: Meta<typeof Indicator> = {
  component: Indicator,
}

export default meta
type Story = StoryObj<typeof Indicator>

export const Bar: Story = {
  args: {
    type: 'bar',
  },
}

export const Screen: Story = {
  args: {
    type: 'screen',
  },
}
