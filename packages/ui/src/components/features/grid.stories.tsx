import type { Meta, StoryObj } from '@storybook/react'

import { Grid } from './grid'

const meta: Meta<typeof Grid> = {
  component: Grid,
}

export default meta
type Story = StoryObj<typeof Grid>

export const Basic: Story = {
  args: {
    gridTemplateColumns: '1fr 1fr 1fr',
    gridTemplateRows: '1fr',
    children: (
      <>
        <div style={{ background: 'red', color: 'white' }}>example</div>
        <div style={{ background: 'blue', color: 'white' }}>example</div>
        <div style={{ background: 'green', color: 'white' }}>example</div>
        <div style={{ background: 'cyan', color: 'white' }}>example</div>
      </>
    ),
  },
}
