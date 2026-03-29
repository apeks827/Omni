import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body)
      next()
    } catch (error: any) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.issues?.map((issue: any) => issue.message) || [
          'Invalid input',
        ],
      })
    }
  }
}

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query)
      next()
    } catch (error: any) {
      return res.status(400).json({
        error: 'Query validation failed',
        details: error.issues?.map((issue: any) => issue.message) || [
          'Invalid query parameters',
        ],
      })
    }
  }
}

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params)
      next()
    } catch (error: any) {
      return res.status(400).json({
        error: 'Parameter validation failed',
        details: error.issues?.map((issue: any) => issue.message) || [
          'Invalid parameters',
        ],
      })
    }
  }
}
