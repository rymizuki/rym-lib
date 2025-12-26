import { vi } from 'vitest'
import fs from 'fs'

export function createMockFileSystem(files: Record<string, string>) {
  const mockReadFileSync = vi.spyOn(fs, 'readFileSync')
  
  mockReadFileSync.mockImplementation((filePath: fs.PathOrFileDescriptor, options?: any) => {
    const path = filePath.toString()
    if (files[path]) {
      return files[path]
    }
    throw new Error(`ENOENT: no such file or directory, open '${path}'`)
  })
  
  return {
    restore: () => mockReadFileSync.mockRestore(),
    mockReadFileSync
  }
}

export function createTestOptions(overrides: any = {}) {
  return {
    method: 'GET',
    headers: undefined,
    header: undefined,
    body: undefined,
    query: undefined,
    verbose: false,
    ...overrides
  }
}

export function expectError(fn: () => any, expectedMessage?: string) {
  try {
    fn()
    throw new Error('Expected function to throw an error')
  } catch (error) {
    if (expectedMessage && !error.message.includes(expectedMessage)) {
      throw new Error(`Expected error message to include "${expectedMessage}", but got "${error.message}"`)
    }
    return error
  }
}