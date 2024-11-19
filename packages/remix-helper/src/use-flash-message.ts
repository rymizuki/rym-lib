import { useState, useEffect } from 'react'

import { useLocation, useNavigate } from '@remix-run/react'

export function useFlashMessage() {
  const [message, setMessage] = useState<string | null>(null)
  const location = useLocation()
  const navigation = useNavigate()

  const close = () => {
    setMessage(null)
    navigation(`${location.pathname}?${location.search}`, {
      state: {},
    })
  }

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message)
    }
  }, [location])

  return {
    close,
    message,
  }
}
