import {
  ShortcutDefinition,
  ShortcutContext,
  ShortcutCategory,
} from '../services/shortcutManager'

type ShortcutHandler = (event: KeyboardEvent, context: ShortcutContext) => void

export function createShortcut(
  id: string,
  key: string,
  description: string,
  category: ShortcutCategory,
  context: ShortcutContext,
  handler: ShortcutHandler,
  priority = 100
): ShortcutDefinition {
  return {
    id,
    key,
    description,
    category,
    context,
    priority,
    enabled: true,
    handler,
  }
}

export function createModifierShortcut(
  id: string,
  key: string,
  modifiers: { ctrl?: boolean; meta?: boolean; alt?: boolean; shift?: boolean },
  description: string,
  category: ShortcutCategory,
  context: ShortcutContext,
  handler: ShortcutHandler,
  priority = 100
): ShortcutDefinition {
  return {
    id,
    key,
    modifiers,
    description,
    category,
    context,
    priority,
    enabled: true,
    handler,
  }
}

export function formatShortcutKey(
  key: string,
  modifiers?: { ctrl?: boolean; meta?: boolean; alt?: boolean; shift?: boolean }
): string {
  const parts: string[] = []
  if (typeof navigator !== 'undefined' && navigator.platform?.includes('Mac')) {
    if (modifiers?.meta) parts.push('⌘')
    if (modifiers?.ctrl) parts.push('⌃')
  } else {
    if (modifiers?.ctrl) parts.push('Ctrl')
    if (modifiers?.meta && !navigator.platform?.includes('Mac'))
      parts.push('Win')
  }
  if (modifiers?.alt) parts.push('⌥')
  if (modifiers?.shift) parts.push('⇧')
  parts.push(key.length === 1 ? key.toUpperCase() : key)
  return parts.join('')
}

export const DEFAULT_SHORTCUTS: ShortcutDefinition[] = [
  createShortcut('new-task', 'n', 'New task', 'tasks', 'global', () => {
    const event = new window.CustomEvent('omni:shortcut', {
      detail: { action: 'new-task' },
    })
    document.dispatchEvent(event)
  }),
  createShortcut('search', '/', 'Focus search', 'navigation', 'global', () => {
    const event = new window.CustomEvent('omni:shortcut', {
      detail: { action: 'search' },
    })
    document.dispatchEvent(event)
  }),
  createShortcut('help', '?', 'Show shortcuts', 'navigation', 'global', () => {
    const event = new window.CustomEvent('omni:shortcut', {
      detail: { action: 'help' },
    })
    document.dispatchEvent(event)
  }),
  createShortcut(
    'escape',
    'Escape',
    'Close modal/panel',
    'navigation',
    'global',
    () => {
      const event = new window.CustomEvent('omni:shortcut', {
        detail: { action: 'escape' },
      })
      document.dispatchEvent(event)
    }
  ),
  createShortcut(
    'delete',
    'Delete',
    'Delete selected',
    'editing',
    'task-list',
    () => {
      const event = new window.CustomEvent('omni:shortcut', {
        detail: { action: 'delete' },
      })
      document.dispatchEvent(event)
    }
  ),
  createShortcut('complete', 'x', 'Mark complete', 'tasks', 'task-list', () => {
    const event = new window.CustomEvent('omni:shortcut', {
      detail: { action: 'complete' },
    })
    document.dispatchEvent(event)
  }),
  createShortcut('edit', 'e', 'Edit task', 'editing', 'task-list', () => {
    const event = new window.CustomEvent('omni:shortcut', {
      detail: { action: 'edit' },
    })
    document.dispatchEvent(event)
  }),
  createShortcut('open', 'Enter', 'Open task', 'tasks', 'task-list', () => {
    const event = new window.CustomEvent('omni:shortcut', {
      detail: { action: 'open' },
    })
    document.dispatchEvent(event)
  }),
  createShortcut(
    'navigate-down',
    'j',
    'Move down',
    'navigation',
    'task-list',
    () => {
      const event = new window.CustomEvent('omni:shortcut', {
        detail: { action: 'navigate', direction: 'down' },
      })
      document.dispatchEvent(event)
    },
    200
  ),
  createShortcut(
    'navigate-up',
    'k',
    'Move up',
    'navigation',
    'task-list',
    () => {
      const event = new window.CustomEvent('omni:shortcut', {
        detail: { action: 'navigate', direction: 'up' },
      })
      document.dispatchEvent(event)
    },
    200
  ),
  createShortcut(
    'priority-high',
    '1',
    'Set high priority',
    'tasks',
    'task-list',
    () => {
      const event = new window.CustomEvent('omni:shortcut', {
        detail: { action: 'priority', level: 'high' },
      })
      document.dispatchEvent(event)
    }
  ),
  createShortcut(
    'priority-medium',
    '2',
    'Set medium priority',
    'tasks',
    'task-list',
    () => {
      const event = new window.CustomEvent('omni:shortcut', {
        detail: { action: 'priority', level: 'medium' },
      })
      document.dispatchEvent(event)
    }
  ),
  createShortcut(
    'priority-low',
    '3',
    'Set low priority',
    'tasks',
    'task-list',
    () => {
      const event = new window.CustomEvent('omni:shortcut', {
        detail: { action: 'priority', level: 'low' },
      })
      document.dispatchEvent(event)
    }
  ),
  createShortcut(
    'toggle-list',
    'l',
    'Toggle list view',
    'views',
    'global',
    () => {
      const event = new window.CustomEvent('omni:shortcut', {
        detail: { action: 'view', target: 'list' },
      })
      document.dispatchEvent(event)
    }
  ),
  createShortcut(
    'toggle-board',
    'b',
    'Toggle board view',
    'views',
    'global',
    () => {
      const event = new window.CustomEvent('omni:shortcut', {
        detail: { action: 'view', target: 'board' },
      })
      document.dispatchEvent(event)
    }
  ),
  createShortcut(
    'toggle-calendar',
    'c',
    'Toggle calendar view',
    'views',
    'global',
    () => {
      const event = new window.CustomEvent('omni:shortcut', {
        detail: { action: 'view', target: 'calendar' },
      })
      document.dispatchEvent(event)
    }
  ),
  createModifierShortcut(
    'submit-form',
    'Enter',
    { ctrl: true },
    'Submit form',
    'editing',
    'modal',
    () => {
      const event = new window.CustomEvent('omni:shortcut', {
        detail: { action: 'submit' },
      })
      document.dispatchEvent(event)
    }
  ),
  createModifierShortcut(
    'submit-form-mac',
    'Enter',
    { meta: true },
    'Submit form',
    'editing',
    'modal',
    () => {
      const event = new window.CustomEvent('omni:shortcut', {
        detail: { action: 'submit' },
      })
      document.dispatchEvent(event)
    }
  ),
  createShortcut('go-tasks', 't', 'Go to tasks', 'navigation', 'global', () => {
    const event = new window.CustomEvent('omni:shortcut', {
      detail: { action: 'go', target: 'tasks' },
    })
    document.dispatchEvent(event)
  }),
  createShortcut(
    'go-calendar',
    'g',
    'Go to calendar',
    'navigation',
    'global',
    () => {
      const event = new window.CustomEvent('omni:shortcut', {
        detail: { action: 'go', target: 'calendar' },
      })
      document.dispatchEvent(event)
    }
  ),
  createShortcut(
    'go-dashboard',
    'd',
    'Go to dashboard',
    'navigation',
    'global',
    () => {
      const event = new window.CustomEvent('omni:shortcut', {
        detail: { action: 'go', target: 'dashboard' },
      })
      document.dispatchEvent(event)
    }
  ),
]
