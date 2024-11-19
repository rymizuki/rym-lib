import { ReactNode } from 'react'

import { sva } from '@styled-system/css'

type Props = {
  children?: ReactNode
  elevation?: '1'
  fullWidth?: boolean
}
export const Card = ({ children, ...props }: Props) => {
  const c = style({ ...props })
  return <div className={c.root}>{children}</div>
}

const style = sva({
  slots: ['root'],
  base: {
    root: {
      background: 'white',
      width: 'fit-content',
      borderRadius: '4px',
      color: '#000000de',
    },
  },
  variants: {
    fullWidth: {
      true: {
        root: {
          width: '100%',
        },
      },
      false: {
        root: {
          width: 'fit-content',
        },
      },
    },
    elevation: {
      none: {
        root: {
          boxShadow: 'none',
        },
      },
      '1': {
        root: {
          boxShadow:
            '0px 5px 5px -3px rgba(0, 0, 0, 0.2), 0px 8px 10px 1px rgba(0, 0, 0, 0.14), 0px 3px 14px 2px rgba(0, 0, 0, 0.12)',
        },
      },
    },
  },
  defaultVariants: {
    fullWidth: false,
  },
})
