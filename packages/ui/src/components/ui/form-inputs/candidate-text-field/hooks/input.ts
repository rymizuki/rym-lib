import { useRef, useState } from 'react'

import { useObserver } from '~/hooks/observer'

import { Item } from '../interfaces'

export function useInput() {
  const events = useObserver<{
    init: (item: Item | undefined) => void
    value: (value: Item['label']) => void
  }>()
  const ref = useRef<HTMLInputElement | null>(null)
  const [focused, setFocusState] = useState<boolean>(false)
  const [value, setInputValue] = useState<string>('')

  const __setValue = (value: string) => {
    if (!ref.current) return
    ref.current.value = value
    setInputValue(value)
  }

  const focusIn = () => {
    // レンダリングタイミングの都合上、即時フォーカス当てるとrenderが上書きしちゃう
    setTimeout(() => ref.current?.focus())
    setFocusState(true)
  }

  const focusOut = () => {
    setFocusState(false)
  }

  const init = (item: Item | undefined) => {
    if (!ref.current) return
    if (item) {
      __setValue(item.label)
    } else {
      __setValue('')
    }
    events.emit('init', item)
  }

  const setValue = (value: string) => {
    if (!ref.current) return
    if (value === undefined) return
    events.emit('value', value)
    __setValue(value)
  }

  return {
    on: events.on,
    off: events.off,
    ref,
    focused,
    value,
    focusIn,
    focusOut,
    init,
    setValue,
  }
}
