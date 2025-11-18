import { PrismaClient } from "@prisma/client"
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined in environment variables")
}

export const prismaTest = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
})
