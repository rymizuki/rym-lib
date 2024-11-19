import { sva } from '@styled-system/css'

import { StyleProps } from '~/helpers/types'
import { MenuModel } from '~/types'

import { Clickable } from '../features'
import { Menu } from './menu'

// region Types
type Props = StyleProps<typeof style> & {
  items: MenuModel[]
}

// region Component
export const MenuList = ({ items, ...props }: Props) => {
  const c = style(props)

  return (
    <div className={c.root}>
      {items.map(({ label, to, children }, index) => (
        <div key={index} className={c.item}>
          {to ? (
            <Clickable to={to}>
              <span className={c.button}>{label}</span>
            </Clickable>
          ) : children ? (
            <Menu items={children}>
              <span className={c.button}>{label}</span>
            </Menu>
          ) : (
            <span className={c.button}>{label}</span>
          )}
        </div>
      ))}
    </div>
  )
}

// region Style
const style = sva({
  slots: ['root', 'item', 'button'],
  base: {
    root: {
      display: 'flex',
    },
    item: {
      position: 'relative',
      flex: '0 0 auto',
    },
    button: {
      position: 'relative',
      display: 'block',
      borderRadius: 'md',
      overflow: 'hidden',
      textAlign: 'center',
      _hover: {
        _before: {
          content: '""',
          display: 'block',
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
      },
    },
  },
  variants: {
    // region Style / theme
    theme: {
      lighten: {
        button: {
          _hover: {
            color: 'black',
            _before: {
              background: 'black',
              opacity: 0.2,
            },
          },
        },
      },
      darken: {
        button: {
          _hover: {
            color: 'white',
            _before: {
              background: 'white',
              opacity: 0.2,
            },
          },
        },
      },
    },
    // region Style / size
    size: {
      sm: {
        root: {
          gap: '0.4rem',
        },
        item: {
          height: '1.4rem',
        },
        button: {
          fontSize: 'sm',
          padding: '0.2rem 0.4rem',
        },
      },
      md: {
        root: {
          gap: '0.8rem',
        },
        item: {
          height: '2rem',
        },
        button: {
          fontSize: 'sm',
          padding: '0.4rem 0.8rem',
        },
      },
      lg: {},
    },
    // region Style / align
    align: {
      left: {
        root: {
          justifyContent: 'flex-start',
        },
      },
      right: {
        root: {
          justifyContent: 'flex-end',
        },
      },
      center: {
        root: {
          justifyContent: 'center',
        },
      },
    },
  },
  defaultVariants: {
    theme: 'lighten',
    size: 'md',
    align: 'left',
  },
})
