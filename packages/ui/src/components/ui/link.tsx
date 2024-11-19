import { sva } from '@styled-system/css'

import { Clickable, ClickableProps } from '../features'

type Props = ClickableProps

export const Link = ({ children, ...props }: Props) => {
  const c = style()
  return (
    <Clickable {...props}>
      <span className={c.root}>{children}</span>
    </Clickable>
  )
}

const style = sva({
  slots: ['root'],
  base: {
    root: {
      color: 'blue.600',
      textDecoration: 'underline',
      _hover: {
        opacity: '0.8',
      },
    },
  },
})
