import { Router } from "express"
import { controllerWrapper as cw } from "../libs/controller.wrapper.js"
import * as genreController from "../controllers/genres.controller/genres.controller.js"
export const genresRouter = Router()
genresRouter.get("/", cw(genreController.getAllGenres))
