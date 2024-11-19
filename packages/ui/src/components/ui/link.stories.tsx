import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { Link } from './link'

const meta: Meta<typeof Link> = {
  component: Link,
}

export default meta
type Story = StoryObj<typeof Link>

export const Basic: Story = {
  args: {
    children: 'Link',
    onClick: fn(),
  },
}
