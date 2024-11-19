import type { Meta, StoryObj } from '@storybook/react'

import { Text } from './text'

const meta: Meta<typeof Text> = {
  component: Text,
  argTypes: {
    as: {
      control: 'radio',
      options: ['span', 'p'],
    },
    preWrap: {
      control: 'boolean',
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
    },
    color: {
      control: 'select',
      options: ['default', 'primary', 'danger', 'inactive', 'inherit'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Text>

export const Basic: Story = {
  args: {
    children: 'Example texts',
    as: 'span',
    size: 'md',
    preWrap: false,
    maxLength: undefined,
  },
}

export const MaxLength: Story = {
  args: {
    children:
      'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    as: 'span',
    size: 'md',
    preWrap: false,
    maxLength: 50,
  },
}

export const PreWrap: Story = {
  args: {
    children: `
Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
    as: 'span',
    size: 'md',
    preWrap: true,
    maxLength: undefined,
  },
}
