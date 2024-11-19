import type { Meta, StoryObj } from '@storybook/react'

import { Container } from './container'

const meta: Meta<typeof Container> = {
  component: Container,
}

export default meta
type Story = StoryObj<typeof Container>

export const Basic: Story = {
  args: {
    children: <div>hello world</div>,
  },
}
