import { ReactNode } from 'react'

import { sva } from '@styled-system/css'

type Props = Parameters<typeof style>[0] & {
  children: ReactNode
}

export const Spacer = ({ children, size }: Props) => {
  const c = style({ size })
  return <div className={c.root}>{children}</div>
}

const style = sva({
  slots: ['root'],
  base: {
    root: {},
  },
  variants: {
    size: {
      none: {
        root: {
          margin: '0',
        },
      },
      sm: {
        root: {
          margin: '1rem 0 0',
        },
      },
      md: {
        root: {
          margin: '2rem 0 0',
        },
      },
    },
  },
  defaultVariants: {
    size: 'md',
  },
})
