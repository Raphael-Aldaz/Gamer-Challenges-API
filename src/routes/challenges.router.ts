import { Router } from "express"
import { controllerWrapper as cw } from "../libs/controller.wrapper.js"
import * as challengeController from "../controllers/challenges.controller/challeges.controller.js"
import { verifyToken } from "../middleware/auth.middleware.js"
export const challengesRouter = Router()
challengesRouter.get("/newest", cw(challengeController.getNewestChallenges))
challengesRouter.get("/popular", cw(challengeController.getMostPopulareChallenges))
challengesRouter.get("/all", cw(challengeController.getAllChallenges))
challengesRouter.get("/mychallenges", verifyToken, cw(challengeController.getChallengesByUserConnected))
challengesRouter.get("/user", cw(challengeController.getAllChalengesByUser))
challengesRouter.get("/game", cw(challengeController.getAllCalengesByGameId))

challengesRouter.post("/", verifyToken, cw(challengeController.newChallenge))
challengesRouter.delete("/", verifyToken, cw(challengeController.deleteChallenge))

challengesRouter.get("/:id", cw(challengeController.getChallengeById))
