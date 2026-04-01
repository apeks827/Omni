import { z } from 'zod'

export const suggestionInputSchema = z.object({
  input: z.string().min(1).max(1000),
})

export const suggestionFeedbackSchema = z.object({
  input: z.string().min(1).max(1000),
  accepted: z.boolean(),
  field: z.enum([
    'due_date',
    'priority',
    'estimated_duration',
    'location',
    'category',
  ]),
  suggested_value: z.string().optional(),
  actual_value: z.string().optional(),
})

export const updateRulesSchema = z.object({
  rules: z.array(
    z.object({
      id: z.string().optional(),
      field: z.enum([
        'due_date',
        'priority',
        'estimated_duration',
        'location',
        'category',
      ]),
      pattern: z.string().min(1).max(200),
      value: z.string().min(1).max(200),
      confidence: z.number().min(0).max(1).optional(),
      enabled: z.boolean().optional(),
      category: z
        .enum(['due_date', 'priority', 'duration', 'location', 'category'])
        .optional(),
    })
  ),
})

export type SuggestionInput = z.infer<typeof suggestionInputSchema>
export type SuggestionFeedback = z.infer<typeof suggestionFeedbackSchema>
export type UpdateRules = z.infer<typeof updateRulesSchema>
