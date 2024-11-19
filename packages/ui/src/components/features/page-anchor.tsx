import { CSSProperties, ReactNode } from 'react'

import { sva } from '@styled-system/css'

type Props = {
  name: string
  children: ReactNode
  gap?: CSSProperties['marginTop']
}

export const PageAnchor = ({ name, children, gap = '4rem' }: Props) => {
  const classNames = style()
  return (
    <div className={classNames.outer}>
      <div
        id={name}
        className={classNames.inner}
        style={{ marginTop: `calc(${gap} * -1)` }}
      />
      {children}
    </div>
  )
}

const style = sva({
  slots: ['outer', 'inner'],
  base: {
    outer: {
      position: 'relative',
      height: '100%',
    },
    inner: {
      position: 'absolute',
    },
  },
})
