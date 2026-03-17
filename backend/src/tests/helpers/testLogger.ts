/**
 * Test logger helper — prints formatted input/output/expected/actual for each test case.
 */
export interface TestCaseLog {
  input: unknown
  expected: unknown
  actual: unknown
}

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'passwordHash', 'currentPassword', 'newPassword', 'accessToken', 'refreshToken']
const LOGGING_ENABLED = process.env.ENABLE_TEST_CASE_LOGS === 'true'

function isSensitiveKey(key: string): boolean {
  const normalizedKey = key.toLowerCase()
  return SENSITIVE_KEYS.some((sensitiveKey) => normalizedKey.includes(sensitiveKey.toLowerCase()))
}

function redactSensitive(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value !== 'object') {
    return typeof value === 'string' && value.length > 256 ? `${value.slice(0, 256)}...[TRUNCATED]` : value
  }
  if (Array.isArray(value)) return value.map(redactSensitive)

  const redacted: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (isSensitiveKey(key)) {
      redacted[key] = '[REDACTED]'
    } else if (typeof val === 'object' && val !== null) {
      redacted[key] = redactSensitive(val)
    } else {
      redacted[key] = val
    }
  }
  return redacted
}

export function logTestCase(description: string, log: TestCaseLog): void {
  if (!LOGGING_ENABLED) {
    return
  }

  const separator = '─'.repeat(60)
  console.log(`\n${separator}`)
  console.log(`  TEST: ${description}`)
  console.log(`  INPUT:    ${JSON.stringify(redactSensitive(log.input))}`)
  console.log(`  EXPECTED: ${JSON.stringify(redactSensitive(log.expected))}`)
  console.log(`  ACTUAL:   ${JSON.stringify(redactSensitive(log.actual))}`)
  console.log(separator)
}
