import { Router } from "express"
import { controllerWrapper as cw } from "../libs/controller.wrapper.js"
import * as platformController from "../controllers/platform.controller/platform.controller.js"
export const platformRouter = Router()

platformRouter.get("/", cw(platformController.getAllPlatform))
