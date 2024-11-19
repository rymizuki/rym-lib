import { sva } from '@styled-system/css'

import { Link } from './link'

type Props = {
  items: { label: string; to?: string; href?: string }[]
}

export const Breadcrumbs = ({ items }: Props) => {
  const c = style()
  return (
    <ol className={c.root}>
      {items.map(({ label, ...item }, index) => (
        <li key={index} className={c.item}>
          {item.to || item.href ? <Link {...item}>{label}</Link> : label}
        </li>
      ))}
    </ol>
  )
}

const style = sva({
  slots: ['root', 'item'],
  base: {
    root: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: '0.4rem',
    },
    item: {
      fontSize: 'xs',
      _after: {
        content: '"/"',
        paddingLeft: '0.4rem',
      },
      _lastOfType: {
        _after: {
          content: '""',
        },
      },
    },
  },
})
