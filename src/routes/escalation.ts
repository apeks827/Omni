import express from 'express'
import { triggerManualEscalationCheck } from '../services/escalation/scheduler.js'
import { findStalledTasks } from '../services/escalation/triage.service.js'

const router = express.Router()

router.post('/trigger', async (req, res) => {
  try {
    const result = await triggerManualEscalationCheck()
    res.json({
      success: true,
      escalatedCount: result.escalatedCount,
      durationMs: result.duration,
    })
  } catch (error) {
    console.error('Manual escalation trigger failed:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

router.get('/stalled', async (req, res) => {
  try {
    const tasks = await findStalledTasks()
    res.json({
      success: true,
      count: tasks.length,
      tasks,
    })
  } catch (error) {
    console.error('Failed to fetch stalled tasks:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
