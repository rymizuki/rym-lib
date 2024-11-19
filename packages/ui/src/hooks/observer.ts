import { useRef } from 'react'

interface Listener {
  name: string
  subscriber: (...args: any[]) => void // eslint-disable-line @typescript-eslint/no-explicit-any
}

type Events = Record<Listener['name'], Listener['subscriber']>

export function useObserver<E extends Events>() {
  const listeners = useRef<Listener[]>([])

  function on<N extends keyof E, F extends E[N]>(
    name: Extract<N, string>,
    subscriber: F,
  ) {
    listeners.current.push({ name, subscriber })
  }

  function off<N extends keyof E, F extends E[N]>(
    name: Extract<N, string>,
    subscriber: F,
  ) {
    listeners.current = listeners.current.filter((listener) => {
      if (listener.name === name) return false
      if (listener.subscriber === subscriber) return false
      return true
    })
  }

  function emit<N extends keyof E, P extends Parameters<E[N]>[0]>(
    name: Extract<N, string>,
    params: P,
  ) {
    for (const listener of listeners.current) {
      if (name === listener.name) {
        listener.subscriber(params)
      }
    }
  }

  return {
    on,
    off,
    emit,
  }
}
