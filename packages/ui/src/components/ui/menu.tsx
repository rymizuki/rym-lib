import { ReactElement, useEffect, useRef, useState } from 'react'

import { sva } from '@styled-system/css'

import { useBackdrop } from '~/hooks/backdrop'
import { MenuModel } from '~/types'

import { Clickable, Icon } from '../features'
import { Card } from './card'

type Props = {
  items: Omit<MenuModel, 'children'>[]
  children: ReactElement
}

export const Menu = ({ children, items }: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const backdrop = useBackdrop(ref)

  const [visibility, setVisibility] = useState<boolean>(false)

  const handleClickOpener = () => {
    setVisibility((visibility) => !visibility)
    backdrop.activate()
  }
  const handleClickItem = () => {
    setVisibility(false)
  }

  useEffect(() => {
    function onBackdropInactive() {
      setVisibility(false)
    }
    backdrop.on('inactivate', onBackdropInactive)
    return () => backdrop.off('inactivate', onBackdropInactive)
  }, [])

  const c = style()

  return (
    <div ref={ref} className={c.root}>
      <div className={c.opener}>
        <Clickable onClick={handleClickOpener}>
          <span className={c.opener__button}>
            <span className={c.opener__button__content}>{children}</span>
            <span className={c.opener__button__arrow}>
              <Icon name={visibility ? 'chevron-up' : 'chevron-down'} />
            </span>
          </span>
        </Clickable>
      </div>
      {visibility && (
        <div className={c.menu}>
          <Card elevation="1">
            {items.map(({ label, ...props }, index) => (
              <div key={index} className={c.menu__item}>
                <Clickable {...props} onClick={handleClickItem}>
                  <span className={c.button}>{label}</span>
                </Clickable>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  )
}

const style = sva({
  slots: [
    'root',
    'opener',
    'opener__button',
    'opener__button__content',
    'opener__button__arrow',
    'menu',
    'menu__item',
    'button',
  ],
  base: {
    root: {
      position: 'relative',
    },
    opener: {},
    opener__button: {
      display: 'flex',
      alignItems: 'center',
    },
    opener__button__content: {
      flex: '1 1 auto',
    },
    opener__button__arrow: {
      flex: '0 0 auto',
      fontSize: 'xx-small',
    },
    menu: {
      position: 'absolute',
      zIndex: 100,
      transition: 'all 500ms ease-in',
    },
    menu__item: {},
    button: {
      position: 'relative',
      display: 'block',
      width: 'fit-content',
      fontSize: 'sm',
      padding: '0.4rem 0.8rem',
      borderRadius: 'md',
      overflow: 'hidden',
      textAlign: 'center',
      whiteSpace: 'nowrap',
      _hover: {
        _before: {
          content: '""',
          display: 'block',
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          background: 'white',
          opacity: 0.3,
        },
      },
    },
  },
})
