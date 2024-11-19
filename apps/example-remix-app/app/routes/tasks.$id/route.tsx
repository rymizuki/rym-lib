import { useLoaderData } from '@remix-run/react'
import { RouteHandle } from '@rym-lib/remix-helper'
import { Container, DateTime, RecordList, Section, Text } from '@rym-lib/ui'

import { loader, LoaderData } from './server/loader.server'

export { loader }

export const handle: RouteHandle = {
  breadcrumbs: ({ params }) => [
    { label: 'Home', to: '/' },
    { label: params.id ?? '' },
  ],
}

export default function RouteVIew() {
  const { task } = useLoaderData<LoaderData>()
  if (!task) {
    return
  }
  return (
    <Container>
      <Section title={task.subject}>
        <RecordList
          spacing="sm"
          items={[
            { label: 'Content', content: <Text preWrap>{task.content}</Text> },
            {
              label: 'Created',
              content: <DateTime>{task.created_at}</DateTime>,
            },
            {
              label: 'Updated',
              content: <DateTime>{task.updated_at}</DateTime>,
            },
          ]}
        />
      </Section>
    </Container>
  )
}
