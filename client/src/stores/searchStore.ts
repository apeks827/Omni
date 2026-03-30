import { create } from 'zustand'
import {
  Task,
  SearchFilters,
  SearchQuery,
  SearchResult,
  SavedSearch,
  SearchHistoryItem,
} from '../types'

interface SearchState {
  isOpen: boolean
  query: string
  filters: SearchFilters
  results: Task[]
  totalResults: number
  suggestions: string[]
  isLoading: boolean
  error: string | null
  savedSearches: SavedSearch[]
  searchHistory: SearchHistoryItem[]
  cache: Map<string, { results: Task[]; timestamp: number }>

  openSearch: () => void
  closeSearch: () => void
  setQuery: (query: string) => void
  setFilters: (filters: SearchFilters) => void
  addFilter: (key: keyof SearchFilters, value: any) => void
  removeFilter: (key: keyof SearchFilters, value?: any) => void
  clearFilters: () => void
  setResults: (results: SearchResult) => void
  setSuggestions: (suggestions: string[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSavedSearches: (searches: SavedSearch[]) => void
  addSavedSearch: (search: SavedSearch) => void
  removeSavedSearch: (id: string) => void
  setSearchHistory: (history: SearchHistoryItem[]) => void
  loadFromSavedSearch: (search: SavedSearch) => void
  getCachedResults: (cacheKey: string) => Task[] | null
  setCachedResults: (cacheKey: string, results: Task[]) => void
}

const CACHE_TTL = 5 * 60 * 1000

export const useSearchStore = create<SearchState>((set, get) => ({
  isOpen: false,
  query: '',
  filters: {},
  results: [],
  totalResults: 0,
  suggestions: [],
  isLoading: false,
  error: null,
  savedSearches: [],
  searchHistory: [],
  cache: new Map(),

  openSearch: () => set({ isOpen: true }),
  closeSearch: () => set({ isOpen: false, query: '', filters: {} }),

  setQuery: query => set({ query }),

  setFilters: filters => set({ filters }),

  addFilter: (key, value) => {
    const { filters } = get()
    if (Array.isArray(filters[key])) {
      set({
        filters: {
          ...filters,
          [key]: [...(filters[key] as any[]), value],
        },
      })
    } else {
      set({ filters: { ...filters, [key]: value } })
    }
  },

  removeFilter: (key, value) => {
    const { filters } = get()
    if (Array.isArray(filters[key])) {
      set({
        filters: {
          ...filters,
          [key]: (filters[key] as any[]).filter(v => v !== value),
        },
      })
    } else {
      const { [key]: _, ...rest } = filters
      set({ filters: rest })
    }
  },

  clearFilters: () => set({ filters: {} }),

  setResults: results =>
    set({
      results: results.tasks,
      totalResults: results.total,
      suggestions: results.suggestions,
      isLoading: false,
      error: null,
    }),

  setSuggestions: suggestions => set({ suggestions }),

  setLoading: loading => set({ isLoading: loading }),

  setError: error => set({ error, isLoading: false }),

  setSavedSearches: searches => set({ savedSearches: searches }),

  addSavedSearch: search =>
    set(state => ({ savedSearches: [...state.savedSearches, search] })),

  removeSavedSearch: id =>
    set(state => ({
      savedSearches: state.savedSearches.filter(s => s.id !== id),
    })),

  setSearchHistory: history => set({ searchHistory: history }),

  loadFromSavedSearch: search =>
    set({
      query: search.queryJson.query,
      filters: search.queryJson.filters,
      isOpen: true,
    }),

  getCachedResults: cacheKey => {
    const { cache } = get()
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.results
    }
    return null
  },

  setCachedResults: (cacheKey, results) => {
    const { cache } = get()
    cache.set(cacheKey, { results, timestamp: Date.now() })
    set({ cache: new Map(cache) })
  },
}))
