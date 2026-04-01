import { extractTaskData, ExtractedTaskData } from '../nlp/extractor.js'
import { createAIClient } from '../ai/client.js'
import { AppError, ErrorCodes } from '../../utils/errors.js'

export interface ParsedIntent {
  id: string
  input: string
  title: string
  due_date?: string
  due_time?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  location?: string
  category?: string
  intent_type: 'task' | 'habit' | 'routine'
  estimated_duration?: number
  confidence: number
  processing_time_ms: number
  created_at: string
}

class IntentService {
  private intentCache: Map<string, ParsedIntent> = new Map()
  private aiClient: ReturnType<typeof createAIClient> | null = null

  private getAIClient() {
    if (!this.aiClient) {
      try {
        this.aiClient = createAIClient()
      } catch {
        console.warn('AI client not available, using fallback parser')
      }
    }
    return this.aiClient
  }

  async parseIntent(input: string): Promise<ParsedIntent> {
    const startTime = Date.now()

    if (!input || input.trim().length === 0) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Input cannot be empty',
        {},
        400
      )
    }

    if (input.length > 5000) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Input exceeds maximum length of 5000 characters',
        {},
        400
      )
    }

    let extracted: ExtractedTaskData
    let confidence = 0.8

    const aiClient = this.getAIClient()
    if (aiClient) {
      try {
        const aiResult = await aiClient.extractTaskFromNaturalLanguage(input)
        let regexResult: ExtractedTaskData | null = null

        try {
          regexResult = extractTaskData(input)
        } catch {
          console.warn('Regex extraction failed for intent classification')
        }

        extracted = {
          title: aiResult.title,
          due_date: aiResult.due_date,
          due_time: aiResult.due_time,
          priority: aiResult.priority,
          location: aiResult.location,
          category: aiResult.category,
          intent_type: regexResult?.intent_type,
          estimated_duration: regexResult?.estimated_duration,
        }
        confidence = aiResult.confidence
      } catch {
        console.warn('AI extraction failed, using regex fallback')
        try {
          extracted = extractTaskData(input)
          confidence = 0.6
        } catch {
          extracted = {
            title: input,
            intent_type: 'task',
          }
          confidence = 0.3
        }
      }
    } else {
      extracted = extractTaskData(input)
      confidence = 0.6
    }

    const intent_type = extracted.intent_type || 'task'

    const intentId = this.generateIntentId()
    const processingTime = Date.now() - startTime

    const parsedIntent: ParsedIntent = {
      id: intentId,
      input,
      title: extracted.title,
      due_date: extracted.due_date,
      due_time: extracted.due_time,
      priority: extracted.priority,
      location: extracted.location,
      category: extracted.category,
      intent_type,
      estimated_duration: extracted.estimated_duration,
      confidence,
      processing_time_ms: processingTime,
      created_at: new Date().toISOString(),
    }

    this.intentCache.set(intentId, parsedIntent)

    if (this.intentCache.size > 1000) {
      const firstKey = this.intentCache.keys().next().value
      if (firstKey) this.intentCache.delete(firstKey)
    }

    return parsedIntent
  }

  getIntent(intentId: string): ParsedIntent | null {
    return this.intentCache.get(intentId) || null
  }

  private generateIntentId(): string {
    return `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export default new IntentService()
