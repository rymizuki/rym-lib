import { sva } from '@styled-system/css'

import { Clickable } from '../../../features'
import { Card } from '../../card'
import { Text } from '../../text'
import { Item } from './interfaces'

// region Types
type Props = {
  items: Item[]
  onSelect?: (item: Item) => void
}

// region Component
export const CandidateMenu = ({ items, onSelect }: Props) => {
  const handleSelect = (value: Item['value']) => {
    const item = items.find((item) => item.value === value)
    if (!item) return
    onSelect?.(item)
  }

  const c = style()

  return (
    <div className={c.menu}>
      <Card elevation="1">
        {items.length ? (
          items.map(({ label, value }) => (
            <div key={value} className={c.menu__item}>
              <Clickable onClick={() => handleSelect(value)}>
                <span className={c.button}>{label}</span>
              </Clickable>
            </div>
          ))
        ) : (
          <div className={c.menu__item}>
            <span className={c.empty_text}>
              <Text size="sm" color="inactive">
                見つかりません
              </Text>
            </span>
          </div>
        )}
      </Card>
    </div>
  )
}

// region Style
const style = sva({
  slots: ['menu', 'menu__item', 'button', 'empty_text'],
  base: {
    menu: {
      position: 'absolute',
      zIndex: 100,
    },
    menu__item: {},
    button: {
      position: 'relative',
      display: 'block',
      padding: '0.8rem 1.2rem',
      fontSize: 'sm',
      _hover: {
        _after: {
          content: '""',
          display: 'block',
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          backgroundColor: 'white',
          opacity: '0.6',
        },
      },
    },
    empty_text: {
      display: 'block',
      padding: '0.8rem 1.2rem',
    },
  },
})
