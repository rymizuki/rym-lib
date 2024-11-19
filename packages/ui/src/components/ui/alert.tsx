import { ReactNode } from 'react'

import { sva } from '@styled-system/css'

import { Icon } from '../features'

type Props = {
  type: 'success' | 'danger'
  children: ReactNode
  title?: string
  closable?: boolean
  onClose?: () => void
}

export const Alert = ({
  type,
  title,
  children,
  closable = false,
  onClose,
}: Props) => {
  const c = style({ type })
  const handleClose = () => {
    onClose?.()
  }
  return (
    <div className={c.root}>
      <div className={c.message}>
        {title && <div className={c.title}>{title}</div>}
        <div className={c.content}>{children}</div>
      </div>
      {closable && (
        <div className={c.closure}>
          <button onClick={handleClose}>
            <Icon name="xmark" />
          </button>
        </div>
      )}
    </div>
  )
}

const style = sva({
  slots: ['root', 'message', 'title', 'content', 'closure'],
  base: {
    root: {
      display: 'flex',
      alignItems: 'center',
      padding: '0.5rem 1rem',
      border: '1px solid',
      borderRadius: 'md',
    },
    message: {
      flex: '1 1 auto',
    },
    title: {},
    content: {
      fontSize: '0.75rem',
    },
    closure: {
      flex: '0 0 auto',
      _hover: {
        opacity: '0.8',
      },
    },
  },
  variants: {
    type: {
      success: {
        root: {
          borderColor: 'green.600',
          backgroundColor: 'green.100',
          color: 'green.900',
        },
      },
      danger: {
        root: {
          borderColor: 'red.600',
          backgroundColor: 'red.100',
          color: 'red.900',
        },
      },
    },
  },
})
