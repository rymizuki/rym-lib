export type IconName =
  | 'caret-down'
  | 'xmark'
  | 'chevron-up'
  | 'chevron-down'
  | 'trash'
  | 'plus'

type Props = {
  name: IconName
}

export const Icon = ({ name }: Props) => {
  return <i className={`fa-solid fa-${name}`} style={{ color: 'inherit' }} />
}
