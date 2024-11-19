import type { Meta, StoryObj } from '@storybook/react'

import { Button } from './button'
import { Table } from './table'

const meta: Meta<typeof Table> = {
  component: Table,
}

export default meta
type Story = StoryObj<typeof Table>

export const Basic: Story = {
  args: {
    scrollable: true,
    columns: [
      { label: 'ID', prop: 'id' },
      { label: 'Name', prop: 'name' },
      { label: 'Content', prop: 'content' },
      { label: 'Content', render: () => <Button>Select</Button>, fixed: true },
    ],
    data: [
      { id: '1', name: 'example 1', content: 'example content 1' },
      { id: '2', name: 'example 2', content: 'example content 2' },
      { id: '3', name: 'example 3', content: 'example content 3' },
      { id: '4', name: 'example 4', content: 'example content 4' },
    ],
  },
}
