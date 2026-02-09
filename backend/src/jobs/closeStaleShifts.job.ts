import 'dotenv/config'

import { closeStaleShifts } from '../services/profile'
import { logger } from '../utils/logger'

async function main() {
  try {
    const closedCount = await closeStaleShifts()
    if (closedCount === 0) {
      logger.info('No stale driver shifts to close')
    } else {
      logger.info(`Closed ${closedCount} stale driver shift${closedCount === 1 ? '' : 's'}`)
    }
  } catch (error) {
    logger.error('Failed to auto-close stale driver shifts', error)
    process.exitCode = 1
  }
}

main()
