import { Flex, FlexItem } from './'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof Flex> = {
  component: Flex,
}

export default meta
type Story = StoryObj<typeof Flex>

export const Basic: Story = {
  args: {
    children: (
      <Flex>
        <FlexItem>A</FlexItem>
        <FlexItem>B</FlexItem>
      </Flex>
    ),
  },
}
