import { config } from "./config"
import { app } from "./src/app"
const port = config.server.port
app.listen(port, () => {
  console.log("Server launchend on port ", port)
})
