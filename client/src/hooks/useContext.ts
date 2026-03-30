import { useState, useEffect } from 'react'
import {
  contextService,
  Context,
  ContextType,
} from '../services/contextDetection'

export function useContext() {
  const [context, setContext] = useState<Context | null>(
    contextService.getContext()
  )

  useEffect(() => {
    const unsubscribe = contextService.subscribe(setContext)
    return unsubscribe
  }, [])

  return context
}

export function useContextPermission(type: ContextType) {
  const [hasPermission, setHasPermission] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    const permissions = contextService.getPermissions()
    if (type === 'location') {
      setHasPermission(permissions.location)
    }
  }, [type])

  const requestPermission = async () => {
    setIsRequesting(true)
    try {
      const granted = await contextService.requestPermission(type)
      setHasPermission(granted)
      return granted
    } finally {
      setIsRequesting(false)
    }
  }

  const revokePermission = () => {
    contextService.revokePermission(type)
    setHasPermission(false)
  }

  return { hasPermission, isRequesting, requestPermission, revokePermission }
}
