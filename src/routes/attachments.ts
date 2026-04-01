import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { handleError } from '../utils/errors.js'
import attachmentService from '../services/attachments/attachment.service.js'
import multer from 'multer'
import path from 'path'
import { randomUUID } from 'crypto'

const router = Router()
router.use(authenticateToken)

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const workspaceId = (req as AuthRequest).workspaceId as string
    const uploadDir = path.join('uploads', workspaceId)
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${randomUUID()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!attachmentService.isAllowedType(file.mimetype)) {
      cb(new Error('File type not allowed'))
      return
    }
    cb(null, true)
  },
})

router.post(
  '/:taskId/attachments',
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      const taskId = req.params.taskId as string
      const userId = req.userId as string
      const workspaceId = req.workspaceId as string

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
      }

      const totalSize = await attachmentService.getTotalSize(taskId)
      const MAX_TASK_SIZE = 50 * 1024 * 1024

      if (totalSize + req.file.size > MAX_TASK_SIZE) {
        return res.status(400).json({
          error: 'Task attachment limit exceeded (50MB)',
        })
      }

      const attachment = await attachmentService.createAttachment(
        {
          task_id: taskId,
          user_id: userId,
          file_name: req.file.originalname,
          file_path: req.file.path,
          file_size: req.file.size,
          mime_type: req.file.mimetype,
        },
        workspaceId
      )

      res.status(201).json(attachment)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to upload attachment')
      res.status(status).json(body)
    }
  }
)

router.get('/:taskId/attachments', async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.taskId as string
    const workspaceId = req.workspaceId as string
    const attachments = await attachmentService.listAttachments(
      taskId,
      workspaceId
    )
    res.json(attachments)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to list attachments')
    res.status(status).json(body)
  }
})

router.get('/attachments/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const workspaceId = req.workspaceId as string
    const attachment = await attachmentService.getAttachment(id, workspaceId)
    res.sendFile(path.resolve(attachment.file_path))
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to get attachment')
    res.status(status).json(body)
  }
})

router.delete('/attachments/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const userId = req.userId as string
    const workspaceId = req.workspaceId as string
    await attachmentService.deleteAttachment(id, userId, workspaceId)
    res.status(204).send()
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to delete attachment')
    res.status(status).json(body)
  }
})

router.get('/attachments/search', async (req: AuthRequest, res: Response) => {
  try {
    const query = req.query.q as string
    const workspaceId = req.workspaceId as string

    if (!query) {
      return res.status(400).json({ error: 'Search query required' })
    }

    const results = await attachmentService.searchByFileName(query, workspaceId)
    res.json(results)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to search attachments')
    res.status(status).json(body)
  }
})

export default router
