import type { Meta, StoryObj } from '@storybook/react'

import { Container } from '../features'
import { Card } from './card'
import { Section } from './section'

const meta: Meta<typeof Card> = {
  component: Card,
}

export default meta
type Story = StoryObj<typeof Card>

export const Basic: Story = {
  args: {
    children: (
      <Container>
        <Section title="Example">
          <p>This is card component.</p>
        </Section>
      </Container>
    ),
    elevation: '1',
    fullWidth: false,
  },
}
