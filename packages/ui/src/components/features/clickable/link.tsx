import { Link as RemixLink } from '@remix-run/react'

import { LinkFeatureProps, ChildrenProps } from './types'

export const LinkFeature = ({
  children,
  ...props
}: LinkFeatureProps & ChildrenProps) => {
  return <RemixLink {...props}>{children}</RemixLink>
}
