import type { Meta, StoryObj } from '@storybook/react'

import { Heading } from './heading'

const meta: Meta<typeof Heading> = {
  component: Heading,
  argTypes: {
    level: {
      control: 'select',
      options: [undefined, '2', '3', '4'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Heading>

export const Basic: Story = {
  args: {
    children: 'Example hading',
    level: '2',
  },
}
