import { describe, it, expect } from 'vitest'
import { BatchProcessor } from './batch-processor.js'
import { expectError } from '../test-utils/test-helpers.js'

describe('BatchProcessor', () => {
  describe('parseCommands', () => {
    it('should parse simple command', () => {
      const commands = ['/api/users']
      const result = BatchProcessor.parseCommands(commands)
      
      expect(result).toEqual([
        {
          command: '/api/users',
          options: {}
        }
      ])
    })

    it('should parse command with single option', () => {
      const commands = ['/api/users --method=GET']
      const result = BatchProcessor.parseCommands(commands)
      
      expect(result).toEqual([
        {
          command: '/api/users',
          options: { method: 'GET' }
        }
      ])
    })

    it('should parse command with multiple options', () => {
      const commands = ['/api/users --method=POST --body={"name":"test"} --verbose']
      const result = BatchProcessor.parseCommands(commands)
      
      expect(result).toEqual([
        {
          command: '/api/users',
          options: {
            method: 'POST',
            body: '{"name":"test"}',
            verbose: true
          }
        }
      ])
    })

    it('should parse multiple commands', () => {
      const commands = [
        '/health',
        '/api/users --method=GET',
        '/api/posts --method=POST --body=@file.json'
      ]
      const result = BatchProcessor.parseCommands(commands)
      
      expect(result).toEqual([
        {
          command: '/health',
          options: {}
        },
        {
          command: '/api/users',
          options: { method: 'GET' }
        },
        {
          command: '/api/posts',
          options: { method: 'POST', body: '@file.json' }
        }
      ])
    })

    it('should handle options with spaces in values', () => {
      const commands = ['/api/search --query="hello world" --sort="name desc"']
      const result = BatchProcessor.parseCommands(commands)
      
      expect(result).toEqual([
        {
          command: '/api/search',
          options: {
            query: '"hello world"',
            sort: '"name desc"'
          }
        }
      ])
    })

    it('should handle options with equals signs in values', () => {
      const commands = ['/api/test --filter=status=active --data=key=value']
      const result = BatchProcessor.parseCommands(commands)
      
      expect(result).toEqual([
        {
          command: '/api/test',
          options: {
            filter: 'status=active',
            data: 'key=value'
          }
        }
      ])
    })

    it('should handle boolean flags', () => {
      const commands = ['/api/users --verbose --debug --method=GET']
      const result = BatchProcessor.parseCommands(commands)
      
      expect(result).toEqual([
        {
          command: '/api/users',
          options: {
            verbose: true,
            debug: true,
            method: 'GET'
          }
        }
      ])
    })

    it('should handle options with separate values', () => {
      const commands = ['/api/users --method GET --limit 10']
      const result = BatchProcessor.parseCommands(commands)
      
      expect(result).toEqual([
        {
          command: '/api/users',
          options: {
            method: 'GET',
            limit: '10'
          }
        }
      ])
    })

    it('should handle complex JSON in options', () => {
      const jsonData = '{"name":"test","nested":{"key":"value"},"array":[1,2,3]}'
      const commands = [`/api/users --method=POST --body=${jsonData}`]
      const result = BatchProcessor.parseCommands(commands)
      
      expect(result).toEqual([
        {
          command: '/api/users',
          options: {
            method: 'POST',
            body: jsonData
          }
        }
      ])
    })

    it('should handle empty commands array', () => {
      const commands: string[] = []
      const result = BatchProcessor.parseCommands(commands)
      
      expect(result).toEqual([])
    })

    it('should handle commands with extra whitespace', () => {
      const commands = ['  /api/users  --method=GET  --verbose  ']
      const result = BatchProcessor.parseCommands(commands)
      
      expect(result).toEqual([
        {
          command: '/api/users',
          options: {
            method: 'GET',
            verbose: true
          }
        }
      ])
    })

    it('should handle file path references', () => {
      const commands = ['/api/users --method=POST --body=@data/user.json --headers=@headers.json']
      const result = BatchProcessor.parseCommands(commands)
      
      expect(result).toEqual([
        {
          command: '/api/users',
          options: {
            method: 'POST',
            body: '@data/user.json',
            headers: '@headers.json'
          }
        }
      ])
    })

    it('should handle mixed option formats', () => {
      const commands = ['/api/users --method=POST --verbose --limit 5 --body={"test":true}']
      const result = BatchProcessor.parseCommands(commands)
      
      expect(result).toEqual([
        {
          command: '/api/users',
          options: {
            method: 'POST',
            verbose: true,
            limit: '5',
            body: '{"test":true}'
          }
        }
      ])
    })
  })

  describe('batchRequestsToCliRequests', () => {
    it('should convert batch requests to CLI requests', () => {
      const batchRequests = [
        {
          command: '/health',
          options: {}
        },
        {
          command: '/api/users',
          options: { method: 'POST', body: '{"name":"test"}' }
        }
      ]
      
      const result = BatchProcessor.batchRequestsToCliRequests(batchRequests)
      
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        method: 'GET',
        path: '/health',
        headers: {},
        body: undefined,
        query: {}
      })
      expect(result[1]).toEqual({
        method: 'POST',
        path: '/api/users',
        headers: {},
        body: { name: 'test' },
        query: {}
      })
    })

    it('should handle complex batch request conversion', () => {
      const batchRequests = [
        {
          command: 'api users',
          options: {
            method: 'GET',
            header: 'authorization: Bearer token',
            limit: '10',
            offset: '0'
          }
        }
      ]
      
      const result = BatchProcessor.batchRequestsToCliRequests(batchRequests)
      
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        method: 'GET',
        path: '/api/users',
        headers: { authorization: 'Bearer token' },
        body: undefined,
        query: { limit: '10', offset: '0' }
      })
    })

    it('should handle empty batch requests', () => {
      const batchRequests: any[] = []
      const result = BatchProcessor.batchRequestsToCliRequests(batchRequests)
      
      expect(result).toEqual([])
    })
  })

  describe('validateBatchOptions', () => {
    it('should pass validation for valid options', () => {
      const validOptions = {
        parallel: true,
        maxConcurrency: 5,
        continueOnError: false,
        timeout: 30000,
        retries: 3
      }
      
      expect(() => BatchProcessor.validateBatchOptions(validOptions)).not.toThrow()
    })

    it('should pass validation for minimal options', () => {
      const minimalOptions = {}
      
      expect(() => BatchProcessor.validateBatchOptions(minimalOptions)).not.toThrow()
    })

    it('should throw error for invalid maxConcurrency (zero)', () => {
      const options = { maxConcurrency: 0 }
      
      expectError(
        () => BatchProcessor.validateBatchOptions(options),
        'maxConcurrency must be greater than 0'
      )
    })

    it('should throw error for invalid maxConcurrency (negative)', () => {
      const options = { maxConcurrency: -1 }
      
      expectError(
        () => BatchProcessor.validateBatchOptions(options),
        'maxConcurrency must be greater than 0'
      )
    })

    it('should throw error for invalid timeout (zero)', () => {
      const options = { timeout: 0 }
      
      expectError(
        () => BatchProcessor.validateBatchOptions(options),
        'timeout must be greater than 0'
      )
    })

    it('should throw error for invalid timeout (negative)', () => {
      const options = { timeout: -1000 }
      
      expectError(
        () => BatchProcessor.validateBatchOptions(options),
        'timeout must be greater than 0'
      )
    })

    it('should throw error for invalid retries (negative)', () => {
      const options = { retries: -1 }
      
      expectError(
        () => BatchProcessor.validateBatchOptions(options),
        'retries must be non-negative'
      )
    })

    it('should pass validation for retries of zero', () => {
      const options = { retries: 0 }
      
      expect(() => BatchProcessor.validateBatchOptions(options)).not.toThrow()
    })

    it('should handle multiple invalid options', () => {
      const options = {
        maxConcurrency: -1,
        timeout: 0,
        retries: -5
      }
      
      // Should throw for the first invalid option encountered
      expect(() => BatchProcessor.validateBatchOptions(options)).toThrow()
    })

    it('should pass validation with undefined values', () => {
      const options = {
        maxConcurrency: undefined,
        timeout: undefined,
        retries: undefined,
        parallel: true,
        continueOnError: false
      }
      
      expect(() => BatchProcessor.validateBatchOptions(options)).not.toThrow()
    })

    it('should handle edge case valid values', () => {
      const options = {
        maxConcurrency: 1,
        timeout: 1,
        retries: 0
      }
      
      expect(() => BatchProcessor.validateBatchOptions(options)).not.toThrow()
    })

    it('should handle large valid values', () => {
      const options = {
        maxConcurrency: 1000,
        timeout: 600000,
        retries: 100
      }
      
      expect(() => BatchProcessor.validateBatchOptions(options)).not.toThrow()
    })
  })
})