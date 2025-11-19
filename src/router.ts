import { Router } from "express"
import { challengesRouter } from "./routes/challenges.router.js"
import { authRouter } from "./routes/auth.router.js"
import { genresRouter } from "./routes/genres.router.js"
import { platformRouter } from "./routes/platform.router.js"

export const router = Router()

router.use("/challenges", challengesRouter)
router.use("/auth", authRouter)
router.use("/genres", genresRouter)
router.use("/platform", platformRouter)
