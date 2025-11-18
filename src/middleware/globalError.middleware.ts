import { NextFunction, Request, Response } from "express"

import z from "zod"
import { logger } from "../libs/log.js"
import { HttpClientError } from "../libs/error.js"

interface ErrorResponse {
  timestamp: string
  status: number
  error: string
  code?: string
  field?: string
  details?: Array<{ path: string; message: string; field?: string }>
  stack?: string
}

export const globalErrorMiddleware = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  const isProduction = process.env.NODE_ENV === "production"

  // Logger avec contexte
  logger.error("An error occurred", {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    userId: "userId" in req ? req.userId : undefined,
  })

  // Construire baseError sans les propriétés optionnelles undefined
  const baseError: ErrorResponse = {
    timestamp: new Date().toISOString(),
    status: 500,
    error: "An error occurred",
    ...(isProduction ? {} : { stack: error.stack }), // N'ajouter stack que si défini
  }

  // Erreur de validation Zod
  if (error instanceof z.ZodError) {
    res.status(400).json({
      ...baseError,
      status: 400,
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
        ...(issue.path[0] ? { field: issue.path[0].toString() } : {}),
      })),
    })
    return
  }

  // Erreur HTTP custom
  if (error instanceof HttpClientError) {
    const response: ErrorResponse = {
      ...baseError,
      status: error.status,
      error: isProduction && error.status === 500 ? "Internal server error" : error.message,
      ...(error.code ? { code: error.code } : {}),
      ...(error.field ? { field: error.field } : {}),
    }
    res.status(error.status).json(response)
    return
  }

  // Erreur inconnue
  res.status(500).json({
    ...baseError,
    status: 500,
    error: isProduction ? "Internal server error" : error.message,
    code: "INTERNAL_ERROR",
  })
}
