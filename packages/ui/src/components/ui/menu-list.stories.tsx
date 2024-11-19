import type { Meta, StoryObj } from '@storybook/react'

import { MenuList } from './menu-list'

const meta: Meta<typeof MenuList> = {
  component: MenuList,
}

export default meta
type Story = StoryObj<typeof MenuList>

export const Basic: Story = {
  args: {
    items: [
      {
        label: 'Example 1',
        children: [
          { label: 'Item 1' },
          { label: 'Item 2' },
          { label: 'Item 3' },
        ],
      },
      { label: 'Example 2' },
    ],
  },
}
