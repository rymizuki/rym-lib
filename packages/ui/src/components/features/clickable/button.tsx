import { ButtonFeatureProps, ChildrenProps } from './types'

export const ButtonFeature = ({
  children,
  type,
  style,
  ...props
}: ButtonFeatureProps & ChildrenProps) => {
  return (
    <button
      {...props}
      style={{ ...style, textAlign: 'inherit' }}
      type={type ?? 'button'}
    >
      {children}
    </button>
  )
}
