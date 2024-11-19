import { ReactNode } from 'react'

import { sva } from '@styled-system/css'

type Props = Parameters<typeof style>[0] & {
  children: ReactNode
}

export function Heading({ children, ...props }: Props) {
  const level = props.level ?? '2'
  const styles = style({ level })
  const Component = `h${level}` as const
  return <Component className={styles.root}>{children}</Component>
}

const style = sva({
  slots: ['root'],
  base: {
    root: {
      color: 'heading',
      fontWeight: 'bold',
      letterSpacing: '0.13rem',
      '& > small': {
        marginLeft: '0.8rem',
        fontSize: 'sm',
      },
    },
  },
  variants: {
    level: {
      '2': {
        root: {
          fontSize: '2xl',
          lineHeight: 1.3,
        },
      },
      '3': {
        root: {
          fontSize: 'lg',
          margin: '0',
        },
      },
      '4': {
        root: {
          fontSize: 'md',
        },
      },
    },
  },
  defaultVariants: {
    level: '2',
  },
})
