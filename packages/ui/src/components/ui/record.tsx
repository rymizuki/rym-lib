import { ComponentProps, ReactNode } from 'react'

import { sva } from '@styled-system/css'

import { StyleProps } from '~/helpers/types'

import { Spacer, Flex, FlexItem } from '../features'

type Props = Pick<ComponentProps<typeof Record>, 'labelWidth'> & {
  items: { label?: string; content: ReactNode }[]
  spacing?: ComponentProps<typeof Spacer>['size']
}

export const RecordList = ({ items, spacing = 'none', ...props }: Props) => {
  return (
    <div>
      {items.map(({ label, content }, index) => (
        <Spacer key={index} size={spacing}>
          <Record {...props} label={label}>
            {content}
          </Record>
        </Spacer>
      ))}
    </div>
  )
}
export const Record = ({
  label,
  children,
  ...props
}: {
  children: ReactNode
  label?: string
} & StyleProps<typeof style>) => {
  const c = style(props)
  return (
    <div className={c.root}>
      <Flex>
        {label && (
          <FlexItem fixed>
            <div className={c.label}>{label}</div>
          </FlexItem>
        )}
        <FlexItem>{children}</FlexItem>
      </Flex>
    </div>
  )
}

const style = sva({
  slots: ['root', 'label', 'content'],
  base: {
    root: {},
    label: {
      fontSize: 'sm',
      fontWeight: 'bold',
    },
    content: {},
  },
  variants: {
    labelWidth: {
      sm: {},
      md: {
        label: {
          width: '8rem',
        },
      },
      lg: {
        label: {
          width: '12rem',
        },
      },
    },
  },
  defaultVariants: {
    labelWidth: 'md',
  },
})
