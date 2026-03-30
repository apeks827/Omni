import { create } from 'zustand'
import { TaskTemplate } from '../types'

interface TemplateState {
  templates: TaskTemplate[]
  isLoading: boolean
  error: string | null
  selectedTemplate: TaskTemplate | null
  isModalOpen: boolean
  fetchTemplates: () => Promise<void>
  createTemplate: (data: Partial<TaskTemplate>) => Promise<TaskTemplate>
  updateTemplate: (id: string, data: Partial<TaskTemplate>) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  instantiateTemplate: (
    id: string,
    variables?: Record<string, string>,
    projectId?: string
  ) => Promise<void>
  selectTemplate: (template: TaskTemplate | null) => void
  openModal: () => void
  closeModal: () => void
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  isLoading: false,
  error: null,
  selectedTemplate: null,
  isModalOpen: false,

  fetchTemplates: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/templates', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch templates')
      const data = await response.json()
      set({ templates: data, isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to fetch templates',
        isLoading: false,
      })
    }
  },

  createTemplate: async data => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create template')
      const template = await response.json()
      set(state => ({
        templates: [template, ...state.templates],
        isLoading: false,
        isModalOpen: false,
      }))
      return template
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to create template',
        isLoading: false,
      })
      throw error
    }
  },

  updateTemplate: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update template')
      const updated = await response.json()
      set(state => ({
        templates: state.templates.map(t => (t.id === id ? updated : t)),
        isLoading: false,
        isModalOpen: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to update template',
        isLoading: false,
      })
      throw error
    }
  },

  deleteTemplate: async id => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (!response.ok) throw new Error('Failed to delete template')
      set(state => ({
        templates: state.templates.filter(t => t.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to delete template',
        isLoading: false,
      })
      throw error
    }
  },

  instantiateTemplate: async (id, variables = {}, projectId) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/templates/${id}/instantiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ variables, project_id: projectId }),
      })
      if (!response.ok) throw new Error('Failed to instantiate template')
      await response.json()
      set({ isLoading: false, isModalOpen: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create task from template',
        isLoading: false,
      })
      throw error
    }
  },

  selectTemplate: template => set({ selectedTemplate: template }),
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false, selectedTemplate: null }),
}))
