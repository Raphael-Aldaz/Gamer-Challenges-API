import z from "zod"

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})
export const jwtPayLoadSchema = z.object({
  userId: z.number().int().min(1),
  roles: z.array(z.string()),
})
