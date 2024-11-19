import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { Button } from './button'

const meta: Meta<typeof Button> = {
  component: Button,
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    color: {
      control: 'select',
      options: ['default', 'primary', 'danger'],
    },
    variant: {
      control: 'select',
      options: ['default', 'text'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Basic: Story = {
  args: {
    children: 'Button',
    size: 'md',
    color: 'default',
    slim: false,
    variant: 'default',
    fullWidth: false,
    disabled: false,
    onClick: fn(),
  },
}

export const Link: Story = {
  args: {
    children: 'Button',
    size: 'md',
    color: 'default',
    slim: false,
    variant: 'default',
    fullWidth: false,
    disabled: false,
    href: '#',
  },
}
