import { NextFunction, Request, Response } from "express"
import jwt, { Secret } from "jsonwebtoken"
import { config } from "../../config.js"
import { UnauthorizedError } from "../libs/error.js"
import { logger } from "../libs/log.js"

export interface JwtPayload {
  userId: number
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.accessToken
    const jwtSecret = config.server.jwtSecret
    if (!token) {
      throw new UnauthorizedError("No authentication token provided")
    }
    const decoded = jwt.verify(token, jwtSecret as Secret) as JwtPayload
    req.userId = decoded.userId
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn("Invalid authentication token")
      throw new UnauthorizedError("Invalid authentication token")
    }
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn("Authentication token expired")
      throw new UnauthorizedError("Authentication token expired")
    }
    throw error
  }
}
