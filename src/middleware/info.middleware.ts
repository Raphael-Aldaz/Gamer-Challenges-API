import { Request, Response } from "express"

export const infoMiddleware = (req: Request, res: Response) => {
  const url = req.url
  const ip = req.ip
  const headers = req.headers
  res.json({ url, ip, headers })
}
