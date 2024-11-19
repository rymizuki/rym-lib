import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { Clickable } from './clickable'

const meta: Meta<typeof Clickable> = {
  component: Clickable,
}

export default meta
type Story = StoryObj<typeof Clickable>

export const LinkWithHref: Story = {
  args: {
    children: 'LINK',
    href: '#',
  },
}

export const Button: Story = {
  args: {
    children: 'BUTTON',
    onClick: fn(),
  },
}
