import {
  Form,
  isRouteErrorResponse,
  useActionData,
  useLoaderData,
  useRouteError,
} from '@remix-run/react'
import {
  Button,
  Container,
  DateTime,
  Section,
  Spacer,
  Table,
  Text,
  TextareaField,
  TextField,
} from '@rym-lib/ui'

import { action, ActionData } from './server/action.server'
import { loader, LoaderData } from './server/loader.server'

export { loader, action }

export default function RouteView() {
  const { taskList } = useLoaderData<LoaderData>()
  const result = useActionData<ActionData>()

  return (
    <Container>
      <Section title="Create task">
        <Form method="post">
          <TextField label="Subject" name="subject" required maxLength={127} />
          <TextareaField
            label="Content"
            name="content"
            rows={6}
            required
            maxLength={3_600}
          />
          <Spacer>
            <Button type="submit" color="primary">
              Submit
            </Button>
          </Spacer>
        </Form>
      </Section>

      <Section title="Tasks">
        <Table
          data={taskList.items}
          columns={[
            { label: 'ID', prop: 'id' },
            { label: 'Subject', prop: 'subject' },
            {
              label: 'Content',
              render: (row) => <Text maxLength={16}>{row.content}</Text>,
            },
            {
              label: 'Created',
              render: (row) => (
                <DateTime format="YYYY.MM.DD HH:mm">{row.created_at}</DateTime>
              ),
            },
            {
              label: 'Updated',
              render: (row) => (
                <DateTime format="YYYY.MM.DD HH:mm">{row.updated_at}</DateTime>
              ),
            },
            {
              label: '',
              render: (row) => <Button to={`/tasks/${row.id}`}>Detail</Button>,
            },
          ]}
        />
      </Section>
    </Container>
  )
}

export const ErrorBoundary = () => {
  const error = useRouteError()
  return (
    <Container>
      {isRouteErrorResponse(error) ? (
        <Section title={`Error: ${error.status} ${error.statusText}`}>
          <p>Error happened {error.statusText}</p>
        </Section>
      ) : (
        <Section title="Unknown error">
          <p>{`${error}`}</p>
        </Section>
      )}
    </Container>
  )
}
