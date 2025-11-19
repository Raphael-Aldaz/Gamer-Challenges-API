import z from "zod"

export const challengeSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre doit avoir au moins 1 caractère")
    .max(255, "Le titre doit avoir maximum 255 caractères"),
  description: z
    .string()
    .min(10, "La description doit contenir au moins 10 caractères")
    .max(5000, "La description doit contenir au maximum 500 caractères"),
  rules: z
    .string()
    .min(10, "Les régles doivent contenir au moins 10 caractères")
    .max(5000, "Les régles doivent contenir au maximum 500 caractères"),
  game_id: z.coerce.number().int().min(1),
})
