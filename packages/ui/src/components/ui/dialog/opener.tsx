import { cloneElement, isValidElement, ReactElement, useState } from 'react'
import { createPortal } from 'react-dom'

interface DialogCloseFunction {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (...args: any[]): void
}

type Props = {
  dialog: ReactElement | ((props: { close: () => void }) => ReactElement)
  children: ReactElement
  onClose?: DialogCloseFunction
}

export const DialogOpener = ({ dialog, children, onClose }: Props) => {
  const [visibility, setVisibilityState] = useState<boolean>(false)

  const handle_opener_click = () => {
    setVisibilityState(true)
    children.props.onClick?.()
  }

  const handle_close = () => {
    setVisibilityState(false)
    onClose?.()
  }

  return (
    <span>
      <span>{cloneElement(children, { onClick: handle_opener_click })}</span>
      {visibility &&
        createPortal(
          typeof dialog === 'function'
            ? dialog({ close: handle_close })
            : cloneElement(dialog, { onClose: handle_close }),
          document.body,
        )}
    </span>
  )
}
