import { Request, Response } from "express"
import { prismaClient } from "../../../prisma/index.js"

export const getAllGenres = async (req: Request, res: Response) => {
  const genres = await prismaClient.genre.findMany({})

  return res.status(200).json({ genres })
}
