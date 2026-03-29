import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { createAIClient } from '../services/ai/client.js'

const router = Router()

let aiClient: ReturnType<typeof createAIClient> | null = null

const getAIClient = () => {
  if (!aiClient) {
    aiClient = createAIClient()
  }
  return aiClient
}

router.use(authenticateToken)

interface AnalyzeTaskRequest {
  title: string
  description?: string
}

router.post('/analyze-task', async (req: AuthRequest, res: Response) => {
  try {
    const { title, description } = req.body as AnalyzeTaskRequest

    if (!title) {
      return res.status(400).json({ error: 'Task title is required' })
    }

    const client = getAIClient()
    const analysis = await client.analyzeTask(title, description)
    res.json(analysis)
  } catch (error) {
    console.error('AI analysis error:', error)
    res.status(500).json({ error: 'AI service unavailable' })
  }
})

router.post('/chat', async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const client = getAIClient()
    const response = await client.chat([{ role: 'user', content: message }])

    res.json({ response })
  } catch (error) {
    console.error('AI chat error:', error)
    res.status(500).json({ error: 'AI service unavailable' })
  }
})

export default router
