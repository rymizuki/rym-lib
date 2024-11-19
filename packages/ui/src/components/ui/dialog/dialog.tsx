import { ReactElement, useEffect, useRef, useState } from 'react'

import { sva } from '@styled-system/css'

import { uniqueId } from '~/helpers/unique-id'

import { Clickable, Icon } from '../../features'
import { Button } from '../button'

// region Type

export type DialogCloseHandler = () => void
export type DialogCancelHandler = () => void
export type DialogSubmitHandler = () => void

type Prop = {
  children: ReactElement
  backdrop?: boolean
  modal?: boolean
  title?: string
  actions?: { cancel?: string; submit?: string }
  onClose?: DialogCloseHandler
  onCancel?: DialogCancelHandler
  onSubmit?: DialogSubmitHandler
}

// region Component
export const Dialog = ({
  backdrop,
  title,
  children,
  actions,
  modal,
  onClose,
  onCancel,
  onSubmit,
}: Prop) => {
  const [visibility, setVisibilityState] = useState<boolean>(false)
  const id = uniqueId('dialog_label')
  const c = style()

  const close = () => {
    setVisibilityState(false)
    setTimeout(() => onClose?.(), 100)
  }

  const cancel = () => {
    onCancel?.()
    close()
  }

  const handle_click_closure = () => {
    cancel()
  }
  const handle_click_backdrop = () => {
    cancel()
  }
  const handle_click_cancel = () => {
    cancel()
  }
  const handle_click_submit = () => {
    onSubmit?.()
    close()
  }

  setTimeout(() => setVisibilityState(true))

  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div className={c.root}>
      {backdrop && (
        <div
          className={c.backdrop}
          role="button"
          tabIndex={-1}
          onClick={handle_click_backdrop}
        ></div>
      )}
      <div
        ref={ref}
        className={c.dialog}
        role="dialog"
        aria-labelledby={id}
        aria-modal={modal}
        data-visible={visibility}
      >
        {title && (
          <div className={c.dialog__header}>
            <h2 id={id} className={c.dialog__header__title}>
              {title}
            </h2>
            <div className={c.dialog__header__closure}>
              <Clickable onClick={handle_click_closure}>
                <span className={c.closure}>
                  <Icon name="xmark" />
                </span>
              </Clickable>
            </div>
          </div>
        )}
        <div className={c.dialog__body}>
          <div>{children}</div>
        </div>
        {actions && (
          <div className={c.dialog__actions}>
            {actions.cancel && (
              <div className={c.dialog__actions__item}>
                <Button type="button" size="md" onClick={handle_click_cancel}>
                  {actions.cancel}
                </Button>
              </div>
            )}
            {actions.submit && (
              <div
                className={c.dialog__actions__item}
                onClick={handle_click_submit}
              >
                <Button type="button" size="md" color="primary">
                  {actions.submit}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// region Style

const style = sva({
  slots: [
    'root',
    'backdrop',
    'dialog',
    'dialog__header',
    'dialog__header__title',
    'dialog__header__closure',
    'dialog__body',
    'dialog__actions',
    'dialog__actions__item',
    'closure',
  ],
  base: {
    root: {
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      width: '100%',
      height: '100%',
      margin: 0,
      zIndex: 500,
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      margin: 0,
      background: 'black',
      opacity: '0.3',
      zIndex: 1,
    },
    dialog: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      display: 'flex',
      flexDirection: 'column',
      width: 'fit-content',
      height: 'fit-content',
      minWidth: '24rem',
      maxWidth: '80%',
      minHeight: '6rem',
      maxHeight: '80%',
      margin: ' auto',
      padding: '0',
      background: 'white',
      borderRadius: 'md',
      zIndex: 2,
      opacity: 0,
      overflow: 'hidden',
      transition: 'opacity 0.5s, scale 0s 0.5s',
      scale: 0,
      '&[data-visible="true"]': {
        opacity: 1,
        transition: 'opacity 0.5s',
        scale: 1,
      },
    },
    dialog__header: {
      flex: '0 0 auto',
      display: 'flex',
      padding: '1rem 1rem 0.4rem',
      borderBottom: '1px solid {colors.gray.300}',
    },
    dialog__header__title: {
      flex: '1 1 auto',
      fontSize: 'sm',
      fontWeight: 'bold',
    },
    dialog__header__closure: {
      flex: '0 0 auto',
    },
    dialog__body: {
      flex: '1 1 auto',
      padding: '1rem',
      overflow: 'auto',
    },
    dialog__actions: {
      flex: '0 0 auto',
      display: 'flex',
      padding: '2rem 1rem 1rem',
      justifyContent: 'flex-end',
      gap: '0.8rem',
    },
    dialog__actions__item: {
      flex: '0 0 auto',
    },
    closure: {
      color: 'gray.600',
      _hover: {
        color: 'gray.400',
      },
      _active: {
        color: 'gray.800',
      },
    },
  },
})
