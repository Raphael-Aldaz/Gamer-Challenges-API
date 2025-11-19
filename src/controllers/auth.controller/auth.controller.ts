import { User } from "@prisma/client"
import { prismaClient } from "../../../prisma/index.js"
import { ConflictError, UnauthorizedError } from "../../libs/error.js"
import { logger } from "../../libs/log.js"
import { generateAuthenticationTokens } from "../../libs/token.js"
import { loginSchema, registerSchema } from "../../schemas/auth.schema.js"
import { Request, Response } from "express"
import argon2 from "argon2"
import { config } from "../../../config.js"
import { validateId } from "../../utils/validate.js"
const DEFAULT_AVATAR_URL = `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * (70 - 1 + 1)) + 1}`

interface Token {
  token: string
  type: string
  expiresInMS: number
}
export const login = async (req: Request, res: Response) => {
  const { email, password } = await loginSchema.parseAsync(req.body)

  const user = await prismaClient.user.findUnique({ where: { email } })
  if (!user) {
    logger.error("Authentication attempt with unknown email", { email })
    throw new UnauthorizedError("Invalid credentials")
  }
  const isMatching = await argon2.verify(user.password, password)
  if (!isMatching) {
    logger.warn("Authentication attempt with email", { email })
    throw new UnauthorizedError("Invalid credentials")
  }

  const { accessToken, refreshToken } = await generateAuthenticationTokens(user)
  await replaceRefreshTokenInDatabase(refreshToken, user)
  setAccesTokenCookie(res, accessToken)
  setRefreshTokenCookie(res, refreshToken)

  res.status(200).json({ accessToken, refreshToken })
}
export const logout = async (req: Request, res: Response) => {
  await clearUserSession(req, res)
  res.status(204).send()
}
export const getAuthenticatedUser = async (req: Request, res: Response) => {
  const userId = req.userId

  if (!userId) {
    throw new UnauthorizedError("User ID is missing from request")
  }
  const user = await prismaClient.user.findUnique({
    where: { user_id: userId },
    omit: { password: true },
  })

  res.json(user)
}
export const register = async (req: Request, res: Response) => {
  const { pseudo, email, password, roles } = registerSchema.parse(req.body)
  const hashedPassword = await argon2.hash(password)
  let mimetype = ""
  let size = 0
  const alreadyExistingUser = await prismaClient.user.findMany({
    where: { OR: [{ email }, { pseudo }] },
    select: { email: true, pseudo: true },
  })
  if (alreadyExistingUser.length > 0) {
    throw new ConflictError("Email or pseudo already used")
  }
  try {
    const res = await fetch(DEFAULT_AVATAR_URL, { method: "HEAD" })
    const ct = res.headers.get("content-type")
    const cl = res.headers.get("content-length")
    if (ct) mimetype = ct
    if (cl) size = parseInt(cl, 10)
  } catch (err) {
    console.warn("HEAD request failed for", DEFAULT_AVATAR_URL, err)
  }
  const newUser = await prismaClient.user.create({
    data: {
      pseudo,
      email,
      password: hashedPassword,
      user_avatar_media: {
        create: {
          filename: `user-${pseudo}-${Date.now()}.jpg`,
          original_name: pseudo.split("/").pop() || "user_avatar.jpg",
          mimetype,
          size,
          path: DEFAULT_AVATAR_URL,
        },
      },
      roles: {
        create: roles.map((role) => ({ role_id: role })),
      },
    },
  })
  if (newUser) {
    const { accessToken, refreshToken } = await generateAuthenticationTokens(newUser)
    await replaceRefreshTokenInDatabase(refreshToken, newUser)
    setAccesTokenCookie(res, accessToken)
    setRefreshTokenCookie(res, refreshToken)
  }

  res.status(200).json({ newUser })
}
export const deleteuser = async (req: Request, res: Response) => {
  const authenticatedUserId = req.userId
  const valideId = validateId(authenticatedUserId)
  const randomHash = await argon2.hash(Math.random().toString())
  const now = new Date()
  const userDeleted = await prismaClient.$transaction(async (tx) => {
    await tx.refreshToken.deleteMany({
      where: { user_id: valideId },
    })
    await tx.challengeLike.deleteMany({
      where: { user_id: valideId },
    })
    await tx.participationLike.deleteMany({
      where: { user_id: valideId },
    })
    await tx.participation.updateMany({
      where: { user_id: valideId, deleted_at: null },
      data: { deleted_at: now },
    })
    await tx.challenge.updateMany({
      where: { user_id: valideId, deleted_at: null },
      data: { deleted_at: now },
    })
    await tx.userRole.deleteMany({
      where: { user_id: valideId },
    })
    return await tx.user.update({
      where: { user_id: valideId, deleted_at: null },
      data: {
        pseudo: `deleted_user${valideId}`,
        email: `deleted_user${valideId}_${Date.now()}@deleted.com`,
        password: randomHash,
        deleted_at: now,
        user_avatar_media_id: null,
      },
    })
  })

  await clearUserSession(req, res)
  return res.status(200).json({
    message: "Compte supprimé avec succès",
  })
}

const replaceRefreshTokenInDatabase = async (refreshToken: Token, user: User) => {
  await prismaClient.$transaction([
    prismaClient.refreshToken.deleteMany({ where: { user_id: user.user_id } }),
    prismaClient.refreshToken.create({
      data: {
        token: refreshToken.token,
        user_id: user.user_id,
        created_at: new Date(),
        expired_at: new Date(new Date().valueOf() + refreshToken.expiresInMS),
      },
    }),
  ])
}
const setAccesTokenCookie = (res: Response, accessToken: Token) => {
  res.cookie("accessToken", accessToken.token, {
    httpOnly: true,
    maxAge: accessToken.expiresInMS,
    secure: config.server.secure,
    sameSite: "lax",
  })
}
const setRefreshTokenCookie = (res: Response, refreshToken: Token) => {
  res.cookie("refreshToken", refreshToken.token, {
    httpOnly: true,
    maxAge: refreshToken.expiresInMS,
    secure: config.server.secure,
    path: "/api/auth/refresh",
    sameSite: "lax",
  })
}
const clearUserSession = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken
  if (refreshToken) {
    await prismaClient.refreshToken.deleteMany({
      where: { token: refreshToken },
    })
  }
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: config.server.secure,
    sameSite: "lax",
  })
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: config.server.secure,
    path: "/api/auth/refresh",
    sameSite: "lax",
  })
}
