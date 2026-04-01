import { useEffect, useState, useCallback } from 'react'
import {
  shortcutManager,
  ShortcutDefinition,
  ShortcutContext,
  ShortcutCategory,
  ModifierKeys,
} from '../services/shortcutManager'

export interface Shortcut {
  id: string
  key: string
  description: string
  category: ShortcutCategory
  defaultKey: string
  modifiers?: ModifierKeys
  context: ShortcutContext
}

export interface ShortcutConflict {
  shortcutId: string
  conflictingId: string
  message: string
}

export function useKeyboardShortcuts(
  shortcuts?: ShortcutDefinition[],
  context?: ShortcutContext
) {
  const [, forceUpdate] = useState({})

  useEffect(() => {
    if (shortcuts) {
      shortcuts.forEach(s => shortcutManager.register(s))
      return () => {
        shortcuts.forEach(s => shortcutManager.unregister(s.id))
      }
    }
  }, [shortcuts])

  useEffect(() => {
    if (context) {
      shortcutManager.setContext(context)
      return () => {
        shortcutManager.clearContext(context)
      }
    }
  }, [context])

  const allShortcuts = shortcutManager.getAllShortcuts()
  const conflicts = shortcutManager.getConflicts()

  const updateShortcut = useCallback(
    (shortcutId: string, newKey: string, modifiers?: ModifierKeys) => {
      shortcutManager.customize(shortcutId, newKey, modifiers)
      shortcutManager.save()
      forceUpdate({})
    },
    []
  )

  const resetShortcut = useCallback((shortcutId: string) => {
    shortcutManager.reset(shortcutId)
    shortcutManager.save()
    forceUpdate({})
  }, [])

  const resetAll = useCallback(() => {
    shortcutManager.resetAll()
    shortcutManager.save()
    forceUpdate({})
  }, [])

  const getShortcutsByCategory = useCallback(() => {
    const shortcuts = shortcutManager.getAllShortcuts()
    return shortcuts.reduce(
      (acc, shortcut) => {
        if (!acc[shortcut.category]) {
          acc[shortcut.category] = []
        }
        acc[shortcut.category].push(shortcut)
        return acc
      },
      {} as Record<ShortcutCategory, ShortcutDefinition[]>
    )
  }, [allShortcuts.length])

  return {
    shortcuts: allShortcuts,
    conflicts,
    updateShortcut,
    resetShortcut,
    resetAll,
    getShortcutsByCategory,
  }
}
