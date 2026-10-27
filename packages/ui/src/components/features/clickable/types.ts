import { ReactElement, ButtonHTMLAttributes } from 'react'

import { Link as RouterLink } from 'react-router'

type RouterLinkProps = Parameters<typeof RouterLink>[0]

export type ChildrenProps = {
  children: string | ReactElement
}
export type ButtonFeatureProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
>
export type LinkFeatureProps = Omit<RouterLinkProps, 'children' | 'ref'>
