import { z } from 'zod'
import { extractTaskData } from '../nlp/extractor.js'

interface AIConfig {
  baseURL: string
  apiKey: string
  model: string
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
}

interface ChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: ChatMessage
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

const extractionSchema = z.object({
  title: z.string(),
  due_date: z.string().optional(),
  due_time: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  location: z.string().optional(),
  category: z.string().optional(),
  confidence: z.number().min(0).max(1),
})

type ExtractionResult = z.infer<typeof extractionSchema>

interface CacheEntry {
  result: ExtractionResult
  timestamp: number
}

class LRUCache {
  private cache: Map<string, CacheEntry>
  private maxSize: number
  private ttl: number

  constructor(maxSize: number = 100, ttlMs: number = 3600000) {
    this.cache = new Map()
    this.maxSize = maxSize
    this.ttl = ttlMs
  }

  get(key: string): ExtractionResult | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    this.cache.delete(key)
    this.cache.set(key, entry)
    return entry.result
  }

  set(key: string, value: ExtractionResult): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }
    this.cache.set(key, { result: value, timestamp: Date.now() })
  }
}

export class AIClient {
  private config: AIConfig
  private extractionCache: LRUCache

  constructor(config: AIConfig) {
    this.config = config
    this.extractionCache = new LRUCache(100, 3600000)
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const requestBody: ChatCompletionRequest = {
      model: this.config.model,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    }

    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as ChatCompletionResponse

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from AI')
    }

    return data.choices[0].message.content
  }

  async extractTaskFromNaturalLanguage(
    input: string
  ): Promise<ExtractionResult> {
    const cacheKey = input.trim().toLowerCase()
    const cached = this.extractionCache.get(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const prompt = `Extract task information from the following natural language input. Return a JSON object with these fields:
- title: the main task description (required)
- due_date: ISO date string if a date is mentioned (optional)
- due_time: time in HH:MM format if mentioned (optional)
- priority: one of "low", "medium", "high", "critical" (optional)
- location: location if mentioned (optional)
- category: category like "work", "personal", "health", "errands", "meeting", "communication", "learning", "creative" (optional)
- confidence: a number between 0 and 1 indicating extraction confidence (required)

Input: "${input}"

Respond with only valid JSON, no additional text.`

      const response = await this.chat([
        {
          role: 'system',
          content:
            'You are a task extraction assistant. Extract structured task data from natural language and return valid JSON.',
        },
        { role: 'user', content: prompt },
      ])

      const parsed = JSON.parse(response)
      const validated = extractionSchema.parse(parsed)

      this.extractionCache.set(cacheKey, validated)
      return validated
    } catch (error) {
      const regexResult = extractTaskData(input)
      const fallbackResult: ExtractionResult = {
        ...regexResult,
        confidence: 0.6,
      }
      return fallbackResult
    }
  }

  async analyzeTask(
    taskTitle: string,
    taskDescription?: string
  ): Promise<{
    priority: 'low' | 'medium' | 'high' | 'critical'
    suggestedTags: string[]
    estimatedDuration?: string
  }> {
    const prompt = `Analyze this task and provide priority, tags, and estimated duration.
Task: ${taskTitle}
${taskDescription ? `Description: ${taskDescription}` : ''}

Respond in JSON format:
{
  "priority": "low|medium|high|critical",
  "suggestedTags": ["tag1", "tag2"],
  "estimatedDuration": "30m|1h|2h|1d|etc"
}`

    const response = await this.chat([
      {
        role: 'system',
        content:
          'You are a task management assistant. Analyze tasks and provide structured recommendations.',
      },
      { role: 'user', content: prompt },
    ])

    try {
      return JSON.parse(response)
    } catch {
      return {
        priority: 'medium',
        suggestedTags: [],
      }
    }
  }
}

export const createAIClient = (): AIClient => {
  const baseURL = process.env.AI_API_URL || 'http://127.0.0.1:20128/v1'
  const apiKey = process.env.AI_API_KEY
  const model = process.env.AI_MODEL || 'simple-tasks'

  if (!apiKey) {
    throw new Error('AI_API_KEY is not configured')
  }

  const config: AIConfig = {
    baseURL,
    apiKey,
    model,
  }

  return new AIClient(config)
}
