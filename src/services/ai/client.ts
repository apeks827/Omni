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

export class AIClient {
  private config: AIConfig

  constructor(config: AIConfig) {
    this.config = config
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
