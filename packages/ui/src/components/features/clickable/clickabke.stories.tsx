import type { Meta, StoryObj } from '@storybook/react'

import { Clickable } from './clickable'

const meta: Meta<typeof Clickable> = {
  component: Clickable,
}

export default meta
type Story = StoryObj<typeof Clickable>

export const Basic: Story = {}
