import { CSSProperties, ReactNode } from 'react'

import { sva } from '@styled-system/css'

type Props = Pick<CSSProperties, 'gridTemplateColumns' | 'gridTemplateRows'> & {
  children: ReactNode
  gap?: 'sm' | 'md' | 'lg'
}

export const Grid = ({ children, gap, ...props }: Props) => {
  const c = style({ gap })
  return (
    <div className={c.root} style={{ ...props }}>
      {children}
    </div>
  )
}

const style = sva({
  slots: ['root'],
  base: {
    root: {
      display: 'grid',
    },
  },
  variants: {
    gap: {
      none: {
        root: {
          gap: 0,
        },
      },
      sm: {
        root: {
          gap: '0.4rem',
        },
      },
      md: {
        root: {
          gap: '0.8rem',
        },
      },
      lg: {
        root: {
          gap: '1.6rem',
        },
      },
    },
  },
  defaultVariants: {
    gap: 'md',
  },
})

export const GridItem = ({ children }: { children: ReactNode }) => {
  return <div>{children}</div>
}
