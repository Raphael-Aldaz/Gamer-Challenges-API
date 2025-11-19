import { z } from "zod"

export const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
})
export const registerSchema = z.object({
  pseudo: z
    .string()
    .min(1, "Le pseudo doit avoir au moins 1 caractère")
    .max(50, "Le pseudo doit avoir au plus 50 caractères"),
  email: z.email(),
  password: z
    .string()
    .min(12, "Le mot de passe doit avoir au moins 12 caractères")
    .max(100, "Le mot de passe doit avoir au plus 100 caractères")
    .refine((password) => /[a-z]/.test(password), {
      message: "Le mot de passe doit contenir au moins une lettre minuscule",
    })
    .refine((password) => /[A-Z]/.test(password), {
      message: "Le mot de passe doit contenir au moins une lettre majuscule",
    })
    .refine((password) => /[0-9]/.test(password), {
      message: "Le mot de passe doit contenir au moins un chiffre",
    })
    .refine((password) => /[!@#$%^&*(),.?":{}|<>]/.test(password), {
      message: "Le mot de passe doit contenir au moins un caractère spécial",
    }),
  confirm: z.string(),
  roles: z.array(z.coerce.number().int()).optional().default([1]),
})
