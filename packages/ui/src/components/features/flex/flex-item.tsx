import { ReactNode } from 'react'

import { sva } from '@styled-system/css'

type Props = {
  children?: ReactNode
  fixed?: boolean
  grow?: boolean
}

export const FlexItem = ({ children, fixed, grow }: Props) => {
  const c = style({ fixed, grow })
  return <div className={c.root}>{children}</div>
}

const style = sva({
  slots: ['root'],
  base: {
    root: {},
  },
  variants: {
    fixed: {
      true: {
        root: {
          flex: '0 0 auto',
        },
      },
    },
    grow: {
      true: {
        root: {
          flex: '1 1 auto',
        },
      },
    },
  },
  defaultVariants: {
    fixed: false,
    grow: false,
  },
})
