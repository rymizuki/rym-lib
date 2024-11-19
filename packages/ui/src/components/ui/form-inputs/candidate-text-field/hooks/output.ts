import { useRef, useState } from 'react'

import { useObserver } from '~/hooks/observer'

import { Item } from '../interfaces'

export function useOutput() {
  const { on, off, emit } = useObserver<{
    init: (item: Item | undefined) => void
    value: (value: Item) => void
  }>()
  const ref = useRef<HTMLInputElement | null>(null)
  const [local_value, setLocalValue] = useState<string>('')

  function __setValue(value: string) {
    if (ref.current) ref.current.value = value
    setLocalValue(value)
  }

  const init = (item: Item | undefined) => {
    if (item) {
      __setValue(item.value)
    } else {
      __setValue('')
    }
    emit('init', item)
  }

  const setValue = (item: Item) => {
    if (!ref.current) return
    __setValue(item.value)
    emit('value', item)
  }

  return {
    on,
    off,
    emit,
    ref,
    value: local_value,
    init,
    setValue,
  }
}
