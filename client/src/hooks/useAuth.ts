import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../services/api'
import { User } from '../types'

const AUTH_TOKEN_KEY = 'authToken'
const USER_KEY = 'omni_auth_user'

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  })

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
      return
    }
    try {
      const user = await apiClient.getCurrentUser()
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      setState({ user, isAuthenticated: true, isLoading: false, error: null })
    } catch {
      apiClient.clearAuthToken()
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = async (email: string, password: string): Promise<boolean> => {
    setState(s => ({ ...s, isLoading: true, error: null }))
    try {
      const { user } = await apiClient.login(email, password)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      setState({ user, isAuthenticated: true, isLoading: false, error: null })
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setState(s => ({ ...s, isLoading: false, error: message }))
      return false
    }
  }

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    setState(s => ({ ...s, isLoading: true, error: null }))
    try {
      const { user } = await apiClient.register(name, email, password)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      setState({ user, isAuthenticated: true, isLoading: false, error: null })
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setState(s => ({ ...s, isLoading: false, error: message }))
      return false
    }
  }

  const logout = () => {
    apiClient.logout()
    localStorage.removeItem(USER_KEY)
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
  }

  const clearError = () => setState(s => ({ ...s, error: null }))

  return {
    ...state,
    login,
    register,
    logout,
    clearError,
  }
}
