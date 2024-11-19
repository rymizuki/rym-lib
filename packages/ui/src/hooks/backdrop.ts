import { RefObject, useEffect, useState } from 'react'

import { useObserver } from './observer'

export function useBackdrop<T extends HTMLElement>(ref: RefObject<T>) {
  const { on, off, emit } = useObserver<{
    activate: () => void
    inactivate: () => void
  }>()
  const [active, setActiveState] = useState<boolean>(false)

  function activate() {
    setActiveState(true)
    emit('activate', undefined)
  }
  function inactivate() {
    setActiveState(false)
    emit('inactivate', undefined)
  }

  useEffect(() => {
    if (!ref.current) return
    if (!active) return

    function onClickDocument(ev: MouseEvent) {
      if (ref.current?.contains(ev.target as Node)) {
        return
      }
      inactivate()
    }

    document.body.addEventListener('click', onClickDocument)
    return () => {
      document.body.removeEventListener('click', onClickDocument)
    }
  }, [ref, active])

  return {
    on,
    off,
    active,
    activate,
    inactivate,
  }
}
