import type { Meta, StoryObj } from '@storybook/react'

import { Clickable } from './clickable'
import { Collapse } from './collapse'

const meta: Meta<typeof Collapse> = {
  component: Collapse,
}

export default meta
type Story = StoryObj<typeof Collapse>

export const Basic: Story = {
  args: {
    opener: <Clickable>Opener</Clickable>,
    content: `
そのときさそりはこう言ってお祈りをはじめました。この傾斜があるもんですからね、川原で待っていようかと言いました。あんなにくるっとまわっていました。さあ、ごらんなさい、そら、どうです、少しおあがりなさい鳥捕りは、だまってこらえてそのまま立って口笛を吹いたり笑ったりして、そっちの方へ行きました。もうまるでひどい峡谷になって、その下の方で起こって、それから苹果を見ました。 
    `,
  },
}
