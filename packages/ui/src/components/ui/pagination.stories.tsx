import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { Pagination } from './pagination'

const meta: Meta<typeof Pagination> = {
  component: Pagination,
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Pagination>

export const Basic: Story = {
  args: {
    size: 'md',
    pagination: {
      current: 1,
      rows: 10,
      hasNext: true,
    },
    onPaginate: fn(),
  },
}
