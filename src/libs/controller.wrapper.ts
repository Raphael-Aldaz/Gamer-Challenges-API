import { Request, Response, NextFunction, RequestHandler } from "express"

export const controllerWrapper = (mdw: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await mdw(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
