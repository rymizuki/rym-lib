import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { Button } from '../button'
import { Dialog } from './dialog'
import { DialogOpener } from './opener'

const meta: Meta<typeof DialogOpener> = {
  component: DialogOpener,
}

export default meta
type Story = StoryObj<typeof DialogOpener>

export const Basic: Story = {
  args: {
    dialog: (
      <Dialog
        backdrop
        modal
        title="Example"
        actions={{ cancel: 'Cancel', submit: 'Submit' }}
        onSubmit={fn()}
      >
        <div>hello world</div>
      </Dialog>
    ),
    children: <Button>Open</Button>,
    onClose: fn(),
  },
}
