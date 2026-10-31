import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { RequestBuilder } from './request-builder.js'
import { createMockFileSystem, createTestOptions, expectError } from '../test-utils/test-helpers.js'

describe('RequestBuilder', () => {
  describe('fromCliArgs', () => {
    describe('path normalization', () => {
      it('should handle normal paths', () => {
        const result = RequestBuilder.fromCliArgs('/api/users', createTestOptions())
        expect(result.path).toBe('/api/users')
      })

      it('should convert spaces to slashes', () => {
        const result = RequestBuilder.fromCliArgs('api users', createTestOptions())
        expect(result.path).toBe('/api/users')
      })

      it('should handle multiple spaces', () => {
        const result = RequestBuilder.fromCliArgs('api users 123 posts', createTestOptions())
        expect(result.path).toBe('/api/users/123/posts')
      })

      it('should handle mixed spaces and slashes', () => {
        const result = RequestBuilder.fromCliArgs('api/users 123', createTestOptions())
        expect(result.path).toBe('/api/users/123')
      })
    })

    describe('method handling', () => {
      it('should default to GET', () => {
        const result = RequestBuilder.fromCliArgs('/test', createTestOptions())
        expect(result.method).toBe('GET')
      })

      it('should handle custom method', () => {
        const result = RequestBuilder.fromCliArgs('/test', createTestOptions({ method: 'post' }))
        expect(result.method).toBe('POST')
      })

      it('should uppercase method', () => {
        const result = RequestBuilder.fromCliArgs('/test', createTestOptions({ method: 'put' }))
        expect(result.method).toBe('PUT')
      })
    })

    describe('headers handling', () => {
      describe('JSON headers format', () => {
        it('should parse valid JSON headers', () => {
          const headers = '{"authorization":"Bearer token","content-type":"application/json"}'
          const result = RequestBuilder.fromCliArgs('/test', createTestOptions({ headers }))
          
          expect(result.headers).toEqual({
            authorization: 'Bearer token',
            'content-type': 'application/json'
          })
        })

        it('should throw error for invalid JSON headers', () => {
          const headers = '{"invalid": json}'
          expectError(
            () => RequestBuilder.fromCliArgs('/test', createTestOptions({ headers })),
            'Invalid headers JSON'
          )
        })
      })

      describe('--header key: value format', () => {
        it('should parse single header', () => {
          const header = 'authorization: Bearer token'
          const result = RequestBuilder.fromCliArgs('/test', createTestOptions({ header }))
          
          expect(result.headers).toEqual({
            authorization: 'Bearer token'
          })
        })

        it('should parse multiple headers', () => {
          const header = [
            'authorization: Bearer token',
            'content-type: application/json'
          ]
          const result = RequestBuilder.fromCliArgs('/test', createTestOptions({ header }))
          
          expect(result.headers).toEqual({
            authorization: 'Bearer token',
            'content-type': 'application/json'
          })
        })

        it('should handle headers with extra spaces', () => {
          const header = '  authorization  :   Bearer token  '
          const result = RequestBuilder.fromCliArgs('/test', createTestOptions({ header }))
          
          expect(result.headers).toEqual({
            authorization: 'Bearer token'
          })
        })

        it('should lowercase header keys', () => {
          const header = 'Authorization: Bearer token'
          const result = RequestBuilder.fromCliArgs('/test', createTestOptions({ header }))
          
          expect(result.headers).toEqual({
            authorization: 'Bearer token'
          })
        })

        it('should throw error for invalid header format', () => {
          const header = 'invalid-header-format'
          expectError(
            () => RequestBuilder.fromCliArgs('/test', createTestOptions({ header })),
            'Invalid header format'
          )
        })

        it('should handle colons in values', () => {
          const header = 'custom-header: value:with:colons'
          const result = RequestBuilder.fromCliArgs('/test', createTestOptions({ header }))
          
          expect(result.headers).toEqual({
            'custom-header': 'value:with:colons'
          })
        })
      })

      describe('combined headers', () => {
        it('should combine JSON headers and --header format', () => {
          const headers = '{"existing":"value"}'
          const header = 'new-header: new value'
          const result = RequestBuilder.fromCliArgs('/test', createTestOptions({ headers, header }))
          
          expect(result.headers).toEqual({
            existing: 'value',
            'new-header': 'new value'
          })
        })
      })
    })

    describe('body handling', () => {
      it('should handle string body', () => {
        const body = 'plain text'
        const result = RequestBuilder.fromCliArgs('/test', createTestOptions({ body }))
        
        expect(result.body).toBe('plain text')
      })

      it('should parse JSON body', () => {
        const body = '{"name":"test","value":123}'
        const result = RequestBuilder.fromCliArgs('/test', createTestOptions({ body }))
        
        expect(result.body).toEqual({ name: 'test', value: 123 })
      })

      it('should handle invalid JSON as string', () => {
        const body = '{invalid json}'
        const result = RequestBuilder.fromCliArgs('/test', createTestOptions({ body }))
        
        expect(result.body).toBe('{invalid json}')
      })

      describe('file loading', () => {
        let mockFs: ReturnType<typeof createMockFileSystem>

        beforeEach(() => {
          mockFs = createMockFileSystem({
            'test.json': '{"name":"from file","id":456}',
            'invalid.json': '{invalid json}'
          })
        })

        afterEach(() => {
          mockFs.restore()
        })

        it('should load JSON from file', () => {
          const body = '@test.json'
          const result = RequestBuilder.fromCliArgs('/test', createTestOptions({ body }))
          
          expect(result.body).toEqual({ name: 'from file', id: 456 })
        })

        it('should throw error for non-existent file', () => {
          const body = '@nonexistent.json'
          expectError(
            () => RequestBuilder.fromCliArgs('/test', createTestOptions({ body })),
            'Failed to read or parse file'
          )
        })

        it('should throw error for invalid JSON file', () => {
          const body = '@invalid.json'
          expectError(
            () => RequestBuilder.fromCliArgs('/test', createTestOptions({ body })),
            'Failed to read or parse file'
          )
        })
      })
    })

    describe('query handling', () => {
      describe('JSON query format', () => {
        it('should parse valid JSON query', () => {
          const query = '{"limit":"10","offset":"0"}'
          const result = RequestBuilder.fromCliArgs('/test', createTestOptions({ query }))
          
          expect(result.query).toEqual({ limit: '10', offset: '0' })
        })

        it('should throw error for invalid JSON query', () => {
          const query = '{invalid json}'
          expectError(
            () => RequestBuilder.fromCliArgs('/test', createTestOptions({ query })),
            'Invalid query JSON'
          )
        })
      })

      describe('--key=value format', () => {
        it('should extract query parameters from options', () => {
          const options = {
            ...createTestOptions(),
            limit: '10',
            offset: '0',
            sort: 'name'
          }
          const result = RequestBuilder.fromCliArgs('/test', options)
          
          expect(result.query).toEqual({
            limit: '10',
            offset: '0',
            sort: 'name'
          })
        })

        it('should exclude reserved keywords', () => {
          const options = {
            ...createTestOptions(),
            method: 'POST',
            headers: '{}',
            header: 'test: value',
            body: '{}',
            query: '{}',
            verbose: true,
            limit: '10'
          }
          const result = RequestBuilder.fromCliArgs('/test', options)
          
          expect(result.query).toEqual({ limit: '10' })
          expect(result.query).not.toHaveProperty('method')
          expect(result.query).not.toHaveProperty('headers')
          expect(result.query).not.toHaveProperty('body')
          expect(result.query).not.toHaveProperty('verbose')
        })

        it('should convert values to strings', () => {
          const options = {
            ...createTestOptions(),
            limit: 10,
            active: true,
            price: 99.99
          }
          const result = RequestBuilder.fromCliArgs('/test', options)
          
          expect(result.query).toEqual({
            limit: '10',
            active: 'true',
            price: '99.99'
          })
        })

        it('should exclude internal properties', () => {
          const options = {
            ...createTestOptions(),
            _: ['some', 'internal'],
            $0: 'internal',
            customParam: 'value'
          }
          const result = RequestBuilder.fromCliArgs('/test', options)
          
          expect(result.query).toEqual({ customParam: 'value' })
          expect(result.query).not.toHaveProperty('_')
          expect(result.query).not.toHaveProperty('$0')
        })
      })

      describe('combined query parameters', () => {
        it('should combine JSON query and --key=value options', () => {
          const options = {
            ...createTestOptions(),
            query: '{"existing":"value"}',
            newParam: 'newValue'
          }
          const result = RequestBuilder.fromCliArgs('/test', options)
          
          expect(result.query).toEqual({
            existing: 'value',
            newParam: 'newValue'
          })
        })
      })
    })
  })

  describe('toExpressRequest', () => {
    it('should convert CliRequest to Express Request format', () => {
      const cliRequest = {
        method: 'POST',
        path: '/api/users',
        headers: { authorization: 'Bearer token' },
        body: { name: 'test' },
        query: { limit: '10' }
      }

      const result = RequestBuilder.toExpressRequest(cliRequest)

      expect(result).toEqual({
        method: 'POST',
        path: '/api/users',
        url: '/api/users?limit=10',
        headers: { authorization: 'Bearer token' },
        body: { name: 'test' },
        query: { limit: '10' }
      })
    })

    it('should handle empty query parameters', () => {
      const cliRequest = {
        method: 'GET',
        path: '/api/users',
        headers: {},
        body: undefined,
        query: {}
      }

      const result = RequestBuilder.toExpressRequest(cliRequest)

      expect(result).toEqual({
        method: 'GET',
        path: '/api/users',
        url: '/api/users',
        headers: {},
        body: undefined,
        query: {}
      })
    })

    it('should URL encode query parameters', () => {
      const cliRequest = {
        method: 'GET',
        path: '/search',
        headers: {},
        body: undefined,
        query: { 
          q: 'hello world',
          filter: 'type=user&status=active'
        }
      }

      const result = RequestBuilder.toExpressRequest(cliRequest)

      expect(result.url).toBe('/search?q=hello%20world&filter=type%3Duser%26status%3Dactive')
    })

    it('should handle multiple query parameters', () => {
      const cliRequest = {
        method: 'GET',
        path: '/api/users',
        headers: {},
        body: undefined,
        query: {
          limit: '10',
          offset: '0',
          sort: 'name',
          order: 'desc'
        }
      }

      const result = RequestBuilder.toExpressRequest(cliRequest)

      expect(result.url).toBe('/api/users?limit=10&offset=0&sort=name&order=desc')
    })
  })
})