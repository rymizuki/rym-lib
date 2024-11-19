import { AnchorHTMLAttributes } from 'react'

import { ButtonFeature } from './button'
import { LinkFeature } from './link'
import { ButtonFeatureProps, ChildrenProps, LinkFeatureProps } from './types'

type Props = (
  | ButtonFeatureProps
  | LinkFeatureProps
  | (AnchorHTMLAttributes<HTMLAnchorElement> & { href: string })
) &
  ChildrenProps & {
    fullWidth?: boolean
  }

export const Clickable = ({ children, fullWidth, ...props }: Props) => {
  const style = {
    ...(fullWidth ? { display: 'block', width: '100%' } : {}),
  }
  if ('to' in props) {
    return (
      <LinkFeature {...props} style={style}>
        {children}
      </LinkFeature>
    )
  }
  if ('href' in props) {
    return (
      <a {...props} style={style}>
        {children}
      </a>
    )
  }
  return (
    <ButtonFeature {...props} style={style}>
      {children}
    </ButtonFeature>
  )
}

export type { Props as ClickableProps }
