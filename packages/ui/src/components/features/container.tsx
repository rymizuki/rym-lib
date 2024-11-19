import { ReactNode } from 'react'

import { sva } from '@styled-system/css'

type Props = {
  children: ReactNode
}

export const Container = ({ children }: Props) => {
  const c = style()
  return <div className={c.root}>{children}</div>
}

const style = sva({
  slots: ['root'],
  base: {
    root: {
      width: '100%',
      margin: '0 auto',
      padding: '0 12px',
      xl: {
        maxWidth: '1185px',
      },
    },
  },
})
