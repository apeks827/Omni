import React, { useState } from 'react'
import {
  Button,
  Input,
  Text,
  Stack,
  Card,
  spacing,
  colors,
  borderRadius,
} from '../design-system'
import { useAuth } from '../hooks/useAuth'

interface AuthScreenProps {
  onAuthenticated: () => void
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const { login, register, isLoading, error, clearError } = useAuth()

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (mode === 'register' && !name.trim()) {
      errors.name = 'Name is required'
    }
    if (!email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email address'
    }
    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (!validate()) return

    let success = false
    if (mode === 'login') {
      success = await login(email, password)
    } else {
      success = await register(name, email, password)
    }
    if (success) onAuthenticated()
  }

  const toggleMode = () => {
    setMode(m => (m === 'login' ? 'register' : 'login'))
    setFieldErrors({})
    clearError()
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.gray100,
        padding: spacing.lg,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: spacing.xl,
        }}
      >
        <Stack spacing="lg">
          <div style={{ textAlign: 'center' }}>
            <Text variant="h2" style={{ marginBottom: spacing.xs }}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </Text>
            <Text variant="body" style={{ color: colors.gray600 }}>
              {mode === 'login'
                ? 'Sign in to access your tasks'
                : 'Start organizing your work in seconds'}
            </Text>
          </div>

          {error && (
            <div
              style={{
                padding: `${spacing.sm} ${spacing.md}`,
                backgroundColor: `${colors.danger}15`,
                border: `1px solid ${colors.danger}`,
                borderRadius: borderRadius.md,
                color: colors.danger,
                fontSize: '0.875rem',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing="md">
              {mode === 'register' && (
                <Input
                  label="Full name"
                  type="text"
                  placeholder="Alex Johnson"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  error={fieldErrors.name}
                  fullWidth
                  autoComplete="name"
                  autoFocus
                />
              )}

              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                error={fieldErrors.email}
                fullWidth
                autoComplete="email"
                autoFocus={mode === 'login'}
              />

              <Input
                label="Password"
                type="password"
                placeholder={
                  mode === 'register' ? 'Min 8 characters' : '••••••••'
                }
                value={password}
                onChange={e => setPassword(e.target.value)}
                error={fieldErrors.password}
                fullWidth
                autoComplete={
                  mode === 'login' ? 'current-password' : 'new-password'
                }
              />

              <Button
                type="submit"
                variant="primary"
                style={{ width: '100%' }}
                disabled={isLoading}
              >
                {isLoading
                  ? mode === 'login'
                    ? 'Signing in...'
                    : 'Creating account...'
                  : mode === 'login'
                    ? 'Sign in'
                    : 'Create account'}
              </Button>
            </Stack>
          </form>

          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={toggleMode}
              style={{
                background: 'none',
                border: 'none',
                color: colors.primary,
                cursor: 'pointer',
                fontSize: '0.875rem',
                padding: 0,
              }}
            >
              {mode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </Stack>
      </Card>
    </div>
  )
}

export default AuthScreen
