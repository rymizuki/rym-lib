import type { Meta, StoryObj } from '@storybook/react'

import { DateTime } from './date-time'

const meta: Meta<typeof DateTime> = {
  component: DateTime,
}

export default meta
type Story = StoryObj<typeof DateTime>

export const Basic: Story = {
  args: {
    children: '2024-01-01 00:00:00',
  },
}

export const WithFormat: Story = {
  args: {
    children: '2024-01-01 00:00:00',
    format: 'YYYY/MM/DD HH:mm',
  },
}
