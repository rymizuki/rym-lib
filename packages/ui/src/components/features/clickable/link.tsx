import { Link as RouterLink } from 'react-router'

import { LinkFeatureProps, ChildrenProps } from './types'

export const LinkFeature = ({
  children,
  ...props
}: LinkFeatureProps & ChildrenProps) => {
  return <RouterLink {...props}>{children}</RouterLink>
}
