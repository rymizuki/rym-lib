import type { Meta, StoryObj } from '@storybook/react'

import { Menu } from './menu'

const meta: Meta<typeof Menu> = {
  component: Menu,
}

export default meta
type Story = StoryObj<typeof Menu>

export const Basic: Story = {
  args: {
    children: <span>Menu</span>,
    items: [
      { label: 'Item 1', href: '#' },
      { label: 'Item 2', href: '#' },
      { label: 'Item 3', href: '#' },
    ],
  },
}
