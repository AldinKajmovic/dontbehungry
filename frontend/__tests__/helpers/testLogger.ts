/**
 * Test logger helper — prints formatted input/output/expected/actual for each test case.
 */
export interface TestCaseLog {
  input: unknown
  expected: unknown
  actual: unknown
}

export function logTestCase(description: string, log: TestCaseLog): void {
  const separator = '─'.repeat(60)
  console.log(`\n${separator}`)
  console.log(`  TEST: ${description}`)
  console.log(`  INPUT:    ${JSON.stringify(log.input)}`)
  console.log(`  EXPECTED: ${JSON.stringify(log.expected)}`)
  console.log(`  ACTUAL:   ${JSON.stringify(log.actual)}`)
  console.log(separator)
}
