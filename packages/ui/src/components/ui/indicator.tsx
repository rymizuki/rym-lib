import { sva } from '@styled-system/css'

type Props = {
  type: 'bar' | 'screen'
}

export const Indicator = ({ type }: Props) => {
  const c = style({})

  switch (type) {
    case 'bar': {
      return (
        <div className={c.bar}>
          <div className={c.bar__inner}></div>
        </div>
      )
    }
    case 'screen': {
      return <div className={c.screen}></div>
    }
    default:
      return null
  }
}

const style = sva({
  slots: ['bar', 'bar__inner', 'screen'],
  base: {
    bar: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: 'full',
      height: '0.4rem',
      backgroundColor: 'gray.200',
      overflow: 'hidden',
    },
    bar__inner: {
      position: 'absolute',
      height: 'full',
      backgroundColor: 'cyan.500',
      animation: 'progress 4s normal',
      animationFillMode: 'forwards',
      animationIterationCount: 'infinite',
    },
    screen: {
      position: 'fixed',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      margin: '0',
      backgroundColor: 'gray.800',
      opacity: '0.4',
      zIndex: '1000',
    },
  },
})
