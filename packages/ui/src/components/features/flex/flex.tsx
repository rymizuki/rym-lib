import { CSSProperties, ReactNode } from 'react'

import { sva } from '@styled-system/css'

type Props = Pick<CSSProperties, 'alignItems' | 'justifyContent'> &
  Parameters<typeof style>[0] & {
    children: ReactNode
    direction?: CSSProperties['flexDirection']
  }

export const Flex = ({ children, direction = 'row', gap, ...props }: Props) => {
  const c = style({ gap })
  return (
    <div
      className={c.root}
      style={{
        ...props,
        flexDirection: direction,
      }}
    >
      {children}
    </div>
  )
}

const style = sva({
  slots: ['root'],
  base: {
    root: {
      display: 'flex',
      width: '100%',
      height: '100%',
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
