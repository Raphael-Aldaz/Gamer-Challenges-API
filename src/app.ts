import express from "express"
import cors from "cors"
import { config } from "../config.js"
import cookieParser from "cookie-parser"
import { xssSanitizer } from "./middleware/xss-sanitizer.middleware.js"
import { helmetMiddleware } from "./middleware/helmet.middleware.js"
import { loggerMiddleware } from "./middleware/logger.middleware.js"
import { globalErrorMiddleware } from "./middleware/globalError.middleware.js"
export const app = express()
app.use(cors({ origin: config.server.allowedOrigins }))
app.use(cookieParser())
app.use(express.json())
app.disable("x-powered-by")
app.use(xssSanitizer)
app.use(helmetMiddleware)
app.use(loggerMiddleware)
app.use(globalErrorMiddleware)
