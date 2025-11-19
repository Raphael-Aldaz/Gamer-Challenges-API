import { Router } from "express"
import { controllerWrapper as cw } from "../libs/controller.wrapper.js"
import * as authController from "../controllers/auth.controller/auth.controller.js"
import { verifyToken } from "../middleware/auth.middleware.js"
export const authRouter = Router()
authRouter.post("/login", cw(authController.login))
authRouter.post("/logout", cw(authController.logout))
authRouter.get("/me", verifyToken, cw(authController.getAuthenticatedUser))
authRouter.post("/register", cw(authController.register))
authRouter.patch("/deleteUser", verifyToken, cw(authController.deleteuser))
