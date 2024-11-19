import type { Meta, StoryObj } from '@storybook/react'

import { Breadcrumbs } from './breadcrumbs'

const meta: Meta<typeof Breadcrumbs> = {
  component: Breadcrumbs,
}

export default meta
type Story = StoryObj<typeof Breadcrumbs>

export const Basic: Story = {
  args: {
    items: [
      { label: 'Home', href: '#/' },
      { label: 'Items', href: '#/items' },
      { label: '1234' },
    ],
  },
}
