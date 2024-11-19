import { ReactElement, useState } from 'react'

import { Flex, FlexItem, Icon } from '../../features'
import { Button } from '../button'
import { Text } from '../text'

// region Types
type ChildrenProps<T> = {
  onChange: (prop: T) => void
  defaultValue: T
  name?: string
  error?: string
}

type RenderProp<T> = (props: ChildrenProps<T>) => ReactElement

type AddableFieldUniqHandler<T> = (event: T) => boolean

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AddableFieldChangeEventHandler<T = any> = (
  event: T,
  index: number,
  rows: T[],
) => void

type Props<T> = {
  children: RenderProp<T>
  initialValue: T
  name?: string
  defaultValue?: T[]
  uniq?: AddableFieldUniqHandler<T>
  onChange?: AddableFieldChangeEventHandler<T>
}

export type { AddableFieldChangeEventHandler }

// region Component
export const AddableField = <T,>({
  children,
  name,
  uniq,
  initialValue,
  defaultValue,
  onChange,
}: Props<T>) => {
  const [rows, setRows] = useState<T[]>(
    defaultValue?.length ? defaultValue : [initialValue],
  )

  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const trigger_error = (index: number, error: string) => {
    setErrors((prev) => ({ ...prev, ...{ [`${index}`]: error } }))
  }

  const handle_change = (index: number, item: T) => {
    setErrors({})
    if (uniq && !uniq(item)) {
      trigger_error(index, '重複しています')
    }
    setRows((rows) => {
      rows[index] = item
      return [...rows]
    })
    setTimeout(() => {
      onChange?.(item, index, rows)
    })
  }

  const handle_click_addition = () => {
    setRows((prev) => [...prev, initialValue])
  }
  const handle_click_remove = (index: number) => {
    const row = rows[index]
    setRows((prev) => [...prev.filter((_, i) => i !== index)])
    setTimeout(() => {
      onChange?.(row as any, index, rows)
    })
  }

  return (
    <div>
      {rows.map((value, index) => {
        const error = errors[`${index}`]
        const props = {
          defaultValue: value,
          name: `${name}[${index}]`,
          error,
          onChange: (event: T) => handle_change(index, event),
        }
        const element = children(props)
        return (
          <div key={index}>
            <Flex alignItems="flex-end">
              <FlexItem grow>{element}</FlexItem>
              <FlexItem fixed>
                {rows.length > 1 && (
                  <Button
                    variant="text"
                    color="danger"
                    slim
                    onClick={() => handle_click_remove(index)}
                  >
                    <Icon name="trash" />
                  </Button>
                )}
              </FlexItem>
              <FlexItem fixed>
                <Button
                  variant="text"
                  onClick={handle_click_addition}
                  disabled={index !== rows.length - 1}
                >
                  <Text size="sm" color="inherit">
                    <Icon name="plus" />
                  </Text>
                </Button>
              </FlexItem>
            </Flex>
            {error && (
              <Text size="sm" color="danger">
                {error}
              </Text>
            )}
          </div>
        )
      })}
    </div>
  )
}
