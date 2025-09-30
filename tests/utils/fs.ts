import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Read a test fixture file and return its contents as a string
 */
export function readFixture(filename: string): string {
  const fixturePath = join(process.cwd(), 'tests', 'fixtures', filename)
  return readFileSync(fixturePath, 'utf-8')
}

