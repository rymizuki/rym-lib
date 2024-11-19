import type { Meta, StoryObj } from '@storybook/react'

import { Spacer } from './spacer'

const meta: Meta<typeof Spacer> = {
  component: Spacer,
  argTypes: {
    size: {
      control: 'select',
      options: ['none', 'sm', 'md'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Spacer>

export const Basic: Story = {
  args: {
    size: undefined,
    children: <div style={{ background: 'blue', color: 'white' }}>example</div>,
  },
}
