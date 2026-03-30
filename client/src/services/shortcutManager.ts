export type ShortcutContext =
  | 'global'
  | 'task-list'
  | 'task-detail'
  | 'calendar'
  | 'modal'
  | 'input-focused'

export type ShortcutCategory =
  | 'navigation'
  | 'tasks'
  | 'editing'
  | 'views'
  | 'system'

export interface ModifierKeys {
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean
}

export interface ShortcutHandler {
  (
    event: KeyboardEvent,
    context: ShortcutContext
  ): void | Promise<void> | boolean
}

export interface ShortcutDefinition {
  id: string
  key: string
  modifiers?: ModifierKeys
  handler: ShortcutHandler
  context: ShortcutContext
  description: string
  category: ShortcutCategory
  enabled: boolean
  priority: number
}

export interface ShortcutConflict {
  shortcutId: string
  conflictingId: string
  key: string
  context: ShortcutContext
  message: string
}

export interface ShortcutCustomization {
  shortcutId: string
  customKey: string
  customModifiers?: ModifierKeys
}

export interface UserShortcutPreferences {
  customizations: ShortcutCustomization[]
  disabledShortcuts: string[]
  version: number
  updatedAt: string
}

const STORAGE_KEY = 'omni_shortcuts_v1'

function normalizeKey(key: string): string {
  const specialKeys: Record<string, string> = {
    ' ': 'Space',
    ArrowUp: 'ArrowUp',
    ArrowDown: 'ArrowDown',
    ArrowLeft: 'ArrowLeft',
    ArrowRight: 'ArrowRight',
    Esc: 'Escape',
    Del: 'Delete',
  }
  return specialKeys[key] || key.charAt(0).toUpperCase() + key.slice(1)
}

function getKeySignature(
  key: string,
  modifiers?: ModifierKeys,
  context?: ShortcutContext
): string {
  const parts: string[] = []
  if (modifiers?.ctrl) parts.push('Ctrl')
  if (modifiers?.alt) parts.push('Alt')
  if (modifiers?.shift) parts.push('Shift')
  if (modifiers?.meta) parts.push('Meta')
  parts.push(key)
  if (context) parts.push(context)
  return parts.join('+')
}

function matchesEvent(
  event: KeyboardEvent,
  key: string,
  modifiers?: ModifierKeys
): boolean {
  if (normalizeKey(event.key) !== normalizeKey(key)) return false
  if (modifiers?.ctrl && !event.ctrlKey) return false
  if (modifiers?.alt && !event.altKey) return false
  if (modifiers?.shift && !event.shiftKey) return false
  if (modifiers?.meta && !event.metaKey) return false
  const hasAnyModifier = modifiers && Object.values(modifiers).some(Boolean)
  if (!hasAnyModifier && (event.ctrlKey || event.altKey || event.metaKey))
    return false
  return true
}

function isTextInput(element: Element | null): boolean {
  if (!element) return false
  const tag = element.tagName.toLowerCase()
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    element.getAttribute('contenteditable') === 'true' ||
    (tag === 'input' && (element as HTMLInputElement).type === 'search')
  )
}

export class ShortcutManager {
  private registry: Map<string, ShortcutDefinition> = new Map()
  private contextMap: Map<string, Set<string>> = new Map()
  private conflictIndex: Map<string, string[]> = new Map()
  private activeContexts: ShortcutContext[] = ['global']
  private enabled = true
  private listenerBound = false
  private listeners: Array<() => void> = []
  private preferences: UserShortcutPreferences = {
    customizations: [],
    disabledShortcuts: [],
    version: 1,
    updatedAt: new Date().toISOString(),
  }

  initialize() {
    if (this.listenerBound) return
    this.listenerBound = true

    const handler = (event: KeyboardEvent) => {
      if (!this.enabled) return

      const target = event.target as Element
      const inTextInput = isTextInput(target)

      if (inTextInput) {
        if (event.key === 'Escape') {
          this.executeShortcut('escape', event, 'input-focused')
        }
        return
      }

      const contexts = this.getContextStack()
      this.executeByContexts(event, contexts)
    }

    document.addEventListener('keydown', handler, true)
    this.listeners.push(() =>
      document.removeEventListener('keydown', handler, true)
    )
  }

  destroy() {
    this.listeners.forEach(unsub => unsub())
    this.listeners = []
    this.listenerBound = false
  }

  register(shortcut: ShortcutDefinition) {
    const signature = getKeySignature(
      shortcut.key,
      shortcut.modifiers,
      shortcut.context
    )
    const existing = this.registry.get(signature)
    if (existing && existing.id !== shortcut.id) {
      const conflictKey = `${signature}:${existing.id}`
      const existingConflicts = this.conflictIndex.get(conflictKey) || []
      if (!existingConflicts.includes(shortcut.id)) {
        existingConflicts.push(shortcut.id)
        this.conflictIndex.set(conflictKey, existingConflicts)
      }
    }

    this.registry.set(signature, shortcut)

    if (!this.contextMap.has(shortcut.context)) {
      this.contextMap.set(shortcut.context, new Set())
    }
    this.contextMap.get(shortcut.context)!.add(signature)
  }

  unregister(shortcutId: string) {
    for (const [signature, shortcut] of this.registry.entries()) {
      if (shortcut.id === shortcutId) {
        this.registry.delete(signature)
        this.contextMap.get(shortcut.context)?.delete(signature)
        break
      }
    }
  }

  update(shortcutId: string, updates: Partial<ShortcutDefinition>) {
    this.unregister(shortcutId)
    const existing = this.findById(shortcutId)
    if (existing) {
      this.register({ ...existing, ...updates })
    }
  }

  enable(shortcutId: string) {
    const shortcut = this.findById(shortcutId)
    if (shortcut) {
      shortcut.enabled = true
    }
  }

  disable(shortcutId: string) {
    const shortcut = this.findById(shortcutId)
    if (shortcut) {
      shortcut.enabled = false
    }
  }

  setEnabled(value: boolean) {
    this.enabled = value
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setContext(context: ShortcutContext) {
    if (!this.activeContexts.includes(context)) {
      this.activeContexts = [context, 'global']
    }
  }

  clearContext(context: ShortcutContext) {
    this.activeContexts = this.activeContexts.filter(c => c !== context)
    if (this.activeContexts.length === 0) {
      this.activeContexts = ['global']
    }
  }

  getConflicts(): ShortcutConflict[] {
    const conflicts: ShortcutConflict[] = []
    const seen = new Set<string>()

    for (const [key, conflictingIds] of this.conflictIndex.entries()) {
      if (conflictingIds.length === 0) continue
      const [signature] = key.split(':')
      for (let i = 0; i < conflictingIds.length; i++) {
        for (let j = i + 1; j < conflictingIds.length; j++) {
          const id1 = conflictingIds[i]
          const id2 = conflictingIds[j]
          const pairKey = [id1, id2].sort().join('|')
          if (seen.has(pairKey)) continue
          seen.add(pairKey)

          const shortcut1 = this.findById(id1)
          const shortcut2 = this.findById(id2)
          if (!shortcut1 || !shortcut2) continue

          conflicts.push({
            shortcutId: id1,
            conflictingId: id2,
            key: signature,
            context: shortcut1.context,
            message: `"${shortcut1.description}" conflicts with "${shortcut2.description}"`,
          })
        }
      }
    }

    return conflicts
  }

  getByCategory(category: ShortcutCategory): ShortcutDefinition[] {
    return Array.from(this.registry.values()).filter(
      s => s.category === category
    )
  }

  getByContext(context: ShortcutContext): ShortcutDefinition[] {
    const signatures = this.contextMap.get(context)
    if (!signatures) return []
    return Array.from(signatures)
      .map(sig => this.registry.get(sig))
      .filter((s): s is ShortcutDefinition => s !== undefined)
  }

  getAllShortcuts(): ShortcutDefinition[] {
    return Array.from(this.registry.values())
  }

  customize(
    shortcutId: string,
    customKey: string,
    customModifiers?: ModifierKeys
  ) {
    const existing = this.findById(shortcutId)
    if (!existing) return

    const custom: ShortcutCustomization = {
      shortcutId,
      customKey,
      customModifiers,
    }

    const idx = this.preferences.customizations.findIndex(
      c => c.shortcutId === shortcutId
    )
    if (idx >= 0) {
      this.preferences.customizations[idx] = custom
    } else {
      this.preferences.customizations.push(custom)
    }

    this.unregister(shortcutId)
    this.register({
      ...existing,
      key: customKey,
      modifiers: customModifiers,
    })
  }

  reset(shortcutId: string) {
    this.preferences.customizations = this.preferences.customizations.filter(
      c => c.shortcutId !== shortcutId
    )
    this.preferences.disabledShortcuts =
      this.preferences.disabledShortcuts.filter(id => id !== shortcutId)
  }

  resetAll() {
    this.preferences = {
      customizations: [],
      disabledShortcuts: [],
      version: 1,
      updatedAt: new Date().toISOString(),
    }
  }

  async save(): Promise<void> {
    this.preferences.updatedAt = new Date().toISOString()
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences))
    } catch {
      console.warn('Failed to save shortcuts to localStorage')
    }
  }

  async load(): Promise<void> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const prefs: UserShortcutPreferences = JSON.parse(raw)
        this.preferences = prefs
        this.applyPreferences()
      }
    } catch {
      console.warn('Failed to load shortcuts from localStorage')
    }
  }

  async sync(): Promise<void> {
    try {
      const response = await fetch('/api/users/me/shortcuts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customizations: this.preferences.customizations,
          disabledShortcuts: this.preferences.disabledShortcuts,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        this.preferences.version = data.version
        this.preferences.updatedAt = data.updatedAt
      }
    } catch {
      console.warn('Failed to sync shortcuts with server')
    }
  }

  export(): string {
    return JSON.stringify(this.preferences, null, 2)
  }

  async import(data: string): Promise<void> {
    try {
      const prefs: UserShortcutPreferences = JSON.parse(data)
      this.preferences = prefs
      this.applyPreferences()
      await this.save()
    } catch {
      throw new Error('Invalid shortcuts data')
    }
  }

  private findById(id: string): ShortcutDefinition | undefined {
    for (const shortcut of this.registry.values()) {
      if (shortcut.id === id) return shortcut
    }
    return undefined
  }

  private getContextStack(): ShortcutContext[] {
    const modal = document.querySelector('[data-shortcut-context="modal"]')
    if (modal) return ['modal', 'global']

    const detail = document.querySelector(
      '[data-shortcut-context="task-detail"]'
    )
    if (detail) return ['task-detail', 'global']

    const calendar = document.querySelector(
      '[data-shortcut-context="calendar"]'
    )
    if (calendar) return ['calendar', 'global']

    const list = document.querySelector('[data-shortcut-context="task-list"]')
    if (list) return ['task-list', 'global']

    return ['global']
  }

  private executeByContexts(event: KeyboardEvent, contexts: ShortcutContext[]) {
    const candidates: Array<{
      shortcut: ShortcutDefinition
      priority: number
    }> = []

    for (const context of contexts) {
      const shortcuts = this.getByContext(context)
      for (const shortcut of shortcuts) {
        if (!shortcut.enabled) continue
        if (this.preferences.disabledShortcuts.includes(shortcut.id)) continue
        if (!matchesEvent(event, shortcut.key, shortcut.modifiers)) continue
        candidates.push({ shortcut, priority: shortcut.priority })
      }
    }

    if (candidates.length === 0) return

    candidates.sort((a, b) => b.priority - a.priority)
    const winner = candidates[0].shortcut

    const result = winner.handler(event, winner.context)
    if (result === false || !event.defaultPrevented) {
      event.preventDefault()
    }
  }

  private executeShortcut(
    shortcutId: string,
    event: KeyboardEvent,
    context: ShortcutContext
  ) {
    const shortcut = this.findById(shortcutId)
    if (!shortcut || !shortcut.enabled) return
    if (this.preferences.disabledShortcuts.includes(shortcutId)) return

    const result = shortcut.handler(event, context)
    if (result === false || !event.defaultPrevented) {
      event.preventDefault()
    }
  }

  private applyPreferences() {
    for (const customization of this.preferences.customizations) {
      const existing = this.findById(customization.shortcutId)
      if (existing) {
        this.unregister(customization.shortcutId)
        this.register({
          ...existing,
          key: customization.customKey,
          modifiers: customization.customModifiers,
        })
      }
    }
  }
}

export const shortcutManager = new ShortcutManager()
