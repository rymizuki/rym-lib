import { ReactElement, ButtonHTMLAttributes } from 'react'

import { Link as RemixLink } from '@remix-run/react'

type RemixLinkProps = Parameters<typeof RemixLink>[0]

export type ChildrenProps = {
  children: string | ReactElement
}
export type ButtonFeatureProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
>
export type LinkFeatureProps = Omit<RemixLinkProps, 'children' | 'ref'>
