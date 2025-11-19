import { Prisma } from "@prisma/client"
import { prismaClient } from "../../../prisma/index.js"
import { NotFoundError, UnauthorizedError } from "../../libs/error.js"
import { Request, Response } from "express"
import { validateId } from "../../utils/validate.js"
import { paginationSchema } from "../../schemas/validation.js"
import { challengeSchema } from "../../schemas/challenge.schema.js"

const challengeInclude: Prisma.ChallengeInclude = {
  _count: {
    select: {
      likes: true,
    },
  },
  game: {
    select: {
      game_media: {
        select: {
          path: true,
        },
      },
    },
  },
}

export const getNewestChallenges = async (req: Request, res: Response) => {
  const allChallenges = await prismaClient.challenge.findMany({
    include: challengeInclude,
    orderBy: {
      created_at: "desc",
    },
    take: 5,
  })

  if (!allChallenges) {
    throw new NotFoundError("No challenges found")
  }
  return res.status(200).json({ allChallenges })
}
export const getMostPopulareChallenges = async (req: Request, res: Response) => {
  const populareChallenges = await prismaClient.challenge.findMany({
    include: challengeInclude,
    take: 5,
    orderBy: {
      likes: {
        _count: "desc",
      },
    },
  })

  if (!populareChallenges) {
    throw new NotFoundError("Popular challenges not found")
  }
  return res.status(200).json({ populareChallenges })
}
export const getChallengeById = async (req: Request, res: Response) => {
  const { id } = req.params
  const valideId = validateId(id)
  const challenge = await prismaClient.challenge.findFirst({
    where: {
      challenge_id: valideId,
    },
  })
  if (!challenge) {
    throw new NotFoundError("Challenge not found")
  }
  return res.status(200).json({ challenge })
}
export const getAllChallenges = async (req: Request, res: Response) => {
  const { page, limit } = paginationSchema.parse(req.query)

  const totalChallenges = await prismaClient.challenge.count()

  if (totalChallenges === 0 || !totalChallenges) {
    throw new NotFoundError("No challenges found")
  }

  const challenges = await prismaClient.challenge.findMany({
    skip: (page - 1) * limit,
    take: limit,
    include: challengeInclude,
  })

  return res.status(200).json({
    page,
    limit,
    total: totalChallenges,
    data: {
      challenges,
    },
  })
}
export const getChallengesByUserConnected = async (req: Request, res: Response) => {
  const userId = req.userId
  const valideId = validateId(userId)

  if (!valideId) {
    throw new NotFoundError(`No challenges for user: ${userId}`)
  }
  const challenges = await prismaClient.challenge.findMany({
    where: { user_id: valideId },
  })
  return res.status(200).json({ challenges, total: challenges.length })
}
export const getAllChalengesByUser = async (req: Request, res: Response) => {
  const { userId } = req.query
  const id = validateId(userId)

  const challenges = await prismaClient.challenge.findMany({
    where: { user_id: id },
  })

  return res.status(200).json({ challenges })
}
export const getAllCalengesByGameId = async (req: Request, res: Response) => {
  const { gameId } = req.query
  const id = validateId(gameId)

  const challenges = await prismaClient.challenge.findMany({
    where: { game_id: id },
  })

  return res.status(200).json({ challenges })
}
export const newChallenge = async (req: Request, res: Response) => {
  const userId = req.userId
  const valideId = validateId(userId)

  if (!valideId) {
    throw new NotFoundError(`No user: ${userId}`)
  }
  const { title, description, rules, game_id } = challengeSchema.parse(req.body)
  const newChallenge = await prismaClient.challenge.create({
    data: {
      title,
      description,
      rules,
      user_id: valideId,
      game_id,
    },
  })
  return res.status(201).json({ newChallenge })
}
export const deleteChallenge = async (req: Request, res: Response) => {
  const userId = req.userId
  const id = validateId(userId)
  const { challengeId } = req.query
  const challenge_id = validateId(challengeId)

  const challenge = await prismaClient.challenge.findFirst({
    where: { challenge_id },
  })
  if (challenge?.user_id !== userId) {
    throw new UnauthorizedError("You can't delete this challenge")
  }
  await prismaClient.challenge.delete({
    where: {
      challenge_id,
      user_id: id,
    },
  })
  return res.status(200).json({ message: `Challenge id:${challenge_id} deleted` })
}
