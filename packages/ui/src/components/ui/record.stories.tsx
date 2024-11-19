import type { Meta, StoryObj } from '@storybook/react'

import { RecordList } from './record'

const meta: Meta<typeof RecordList> = {
  component: RecordList,
  argTypes: {
    labelWidth: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
    },
    spacing: {
      control: 'radio',
      options: ['none', 'sm', 'md'],
    },
  },
}

export default meta
type Story = StoryObj<typeof RecordList>

export const Basic: Story = {
  args: {
    items: [
      { label: 'Key 1', content: <p>value 1</p> },
      { label: 'Key 2', content: <p>value 2</p> },
    ],
    labelWidth: 'sm',
  },
}
