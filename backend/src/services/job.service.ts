import fs from 'fs'
import path from 'path'
import { logger } from '../utils/logger'
import { closeStaleShifts } from './profile'

interface JobDefinition {
  name: string
  description: string
  execute: () => Promise<string>
}

// Registry maps job file names (without extension) to their definitions
const JOB_REGISTRY: Record<string, JobDefinition> = {
  closeStaleShifts: {
    name: 'closeStaleShifts',
    description: 'Auto-close driver shifts that have been active longer than 12 hours',
    execute: async () => {
      const closedCount = await closeStaleShifts()
      if (closedCount === 0) {
        return 'No stale driver shifts to close'
      }
      return `Closed ${closedCount} stale driver shift${closedCount === 1 ? '' : 's'}`
    },
  },
}

export interface JobInfo {
  name: string
  description: string
}

export interface JobResult {
  job: string
  success: boolean
  message: string
  durationMs: number
}

export function listJobs(): JobInfo[] {
  const jobsDir = path.join(__dirname, '..', 'jobs')

  if (!fs.existsSync(jobsDir)) {
    return []
  }

  const files = fs.readdirSync(jobsDir)
    .filter((f) => f.endsWith('.job.ts') || f.endsWith('.job.js'))
    .map((f) => f.replace(/\.job\.(ts|js)$/, ''))

  return files
    .filter((name) => name in JOB_REGISTRY)
    .map((name) => ({
      name: JOB_REGISTRY[name].name,
      description: JOB_REGISTRY[name].description,
    }))
}

export async function executeJob(jobName: string): Promise<JobResult> {
  const definition = JOB_REGISTRY[jobName]

  if (!definition) {
    throw new Error(`Unknown job: ${jobName}`)
  }

  const start = Date.now()
  logger.info(`Job started: ${jobName}`)

  try {
    const message = await definition.execute()
    const durationMs = Date.now() - start

    logger.info(`Job completed: ${jobName}`, { durationMs, message })

    return { job: jobName, success: true, message, durationMs }
  } catch (error) {
    const durationMs = Date.now() - start
    const errMessage = error instanceof Error ? error.message : 'Unknown error'

    logger.error(`Job failed: ${jobName}`, error, { durationMs })

    return { job: jobName, success: false, message: errMessage, durationMs }
  }
}
