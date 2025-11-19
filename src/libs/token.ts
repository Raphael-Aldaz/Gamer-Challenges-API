import { User } from "@prisma/client"
import z from "zod"
import crypto from "node:crypto"
import jwt from "jsonwebtoken"

import { BadRequestError } from "./error.js"
import { prismaClient } from "../../prisma/index.js"
import { jwtPayLoadSchema } from "../schemas/validation.js"
import { config } from "../../config.js"

export type ValidateJwtPayload = z.infer<typeof jwtPayLoadSchema>
export const generateAuthenticationTokens = async (user: User) => {
  const userRole = await prismaClient.user.findUnique({
    where: { user_id: user.user_id },
    select: {
      user_id: true,
      roles: {
        select: {
          role: {
            select: {
              role_name: true,
            },
          },
        },
      },
    },
  })

  if (!userRole) {
    throw new Error("User not found")
  }

  const payload: ValidateJwtPayload = {
    userId: userRole.user_id,
    roles: userRole.roles.map((r) => r.role.role_name),
  }
  const JWT_SECRET = getJwtSecret()
  if (!JWT_SECRET) {
    throw new Error("JWT SECRET KEY is not defined in .env")
  }
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: "1h",
  })
  const refreshToken = crypto.randomBytes(128).toString("base64")

  return {
    accessToken: {
      token: accessToken,
      type: "Bearer",
      expiresInMS: 1 * 60 * 60 * 1000, // 1h
    },
    refreshToken: {
      token: refreshToken,
      type: "Bearer",
      expiresInMS: 7 * 24 * 60 * 60 * 1000, // 7j
    },
  }
}
export const getJwtSecret = () => {
  const JWT_SECRET = config.server.jwtSecret
  if (!JWT_SECRET) {
    throw new BadRequestError("JWT SECRET KEY is not defined in .env")
  }

  return JWT_SECRET
}
