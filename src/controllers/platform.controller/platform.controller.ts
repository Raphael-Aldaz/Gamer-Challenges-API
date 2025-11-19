import { Request, Response } from "express"
import { prismaClient } from "../../../prisma/index.js"

export const getAllPlatform = async (req: Request, res: Response) => {
  const platforms = await prismaClient.platform.findMany({})
  return res.status(200).json({ platforms })
}
