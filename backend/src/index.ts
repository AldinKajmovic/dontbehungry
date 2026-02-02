import 'dotenv/config'
import { createServer } from 'http'
import app from './app'
import { config } from './config'
import { initializeSocket } from './socket'
import { logger } from './utils/logger'

const httpServer = createServer(app)
initializeSocket(httpServer)

httpServer.listen(config.port, () => {
  logger.info(`Server running on http://localhost:${config.port}`)
})
