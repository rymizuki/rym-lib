import { useRef, useState } from 'react'

import { useObserver } from '~/hooks/observer'

import { Item, LoaderFunction } from '../interfaces'

export function useCandidateLoader(executor: LoaderFunction) {
  const loading = useRef<boolean>(false)
  const { on, off, emit } = useObserver<{
    loading: () => void
    loaded: (items: Item[]) => void
    error: (error: unknown) => void
  }>()
  const [data, setData] = useState<Item[] | null>(null)

  const exec = async (keyword: string) => {
    if (loading.current) return
    loading.current = true
    emit('loading', undefined)
    try {
      const ret = await executor(keyword)
      setData(ret)
      loading.current = false
      emit('loaded', ret)
    } catch (error) {
      console.error(error)
      emit('error', error)
    }
  }

  return {
    on,
    off,
    data,
    loading,
    exec,
  }
}
