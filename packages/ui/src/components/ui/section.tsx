import { ComponentProps, ReactNode } from 'react'

import { sva } from '@styled-system/css'

import { Flex, FlexItem } from '../features'
import { Heading } from './heading'
import { Link } from './link'

export const Section = ({
  children,
  title,
  actions,
  level = '2',
}: {
  children: ReactNode
  title?: string
  level?: ComponentProps<typeof Heading>['level']
  actions?: {
    label: string
    to?: string
  }[]
}) => {
  const c = style({
    size: level === '2' ? 'lg' : level === '3' ? 'md' : 'sm',
  })
  return (
    <section className={c.root}>
      {title && (
        <Heading level={level}>
          <Flex>
            <FlexItem>{title}</FlexItem>
            {actions &&
              actions.map((action, index) => (
                <FlexItem key={index} fixed>
                  <span className={c.action}>
                    <Link to={action.to}>{action.label}</Link>
                  </span>
                </FlexItem>
              ))}
          </Flex>
        </Heading>
      )}
      <div>{children}</div>
    </section>
  )
}

const style = sva({
  slots: ['root', 'action'],
  base: {
    root: {
      padding: '0 0 2rem',
    },
    action: {
      _before: {
        content: '"["',
      },
      _after: {
        content: '"]"',
      },
    },
  },
  variants: {
    size: {
      lg: { root: { margin: '2.4rem 0 0' }, action: { fontSize: 'sm' } },
      md: { root: { margin: '1.2rem 0' }, action: { fontSize: 'sm' } },
      sm: { root: { margin: '0.4rem 0' }, action: { fontSize: 'xs' } },
    },
  },
})
