import { describe, it, expect, beforeEach } from 'vitest'
import { CliAdapter } from './cli-adapter.js'
import { createMockExpressApp } from '../test-utils/mock-express-app.js'
import type { CliRequest } from '../types/index.js'

describe('CliAdapter', () => {
  let app: ReturnType<typeof createMockExpressApp>
  let adapter: CliAdapter

  beforeEach(() => {
    app = createMockExpressApp()
    adapter = new CliAdapter(app)
  })

  describe('executeRequest', () => {
    it('should execute GET request successfully', async () => {
      const request: CliRequest = {
        method: 'GET',
        path: '/health',
        headers: {},
        body: undefined,
        query: {}
      }

      const response = await adapter.executeRequest(request)

      expect(response.statusCode).toBe(200)
      expect(response.headers['content-type']).toBe('application/json')
      
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('status', 'ok')
      expect(body).toHaveProperty('timestamp')
    })

    it('should execute GET request with query parameters', async () => {
      const request: CliRequest = {
        method: 'GET',
        path: '/api/users',
        headers: {},
        body: undefined,
        query: { limit: '1', offset: '0' }
      }

      const response = await adapter.executeRequest(request)

      expect(response.statusCode).toBe(200)
      
      const body = JSON.parse(response.body)
      expect(body.users).toHaveLength(1)
      expect(body.pagination).toEqual({ limit: 1, offset: 0 })
    })

    it('should execute POST request with body', async () => {
      const request: CliRequest = {
        method: 'POST',
        path: '/api/users',
        headers: {},
        body: { name: 'Test User', email: 'test@example.com' },
        query: {}
      }

      const response = await adapter.executeRequest(request)

      expect(response.statusCode).toBe(201)
      
      const body = JSON.parse(response.body)
      expect(body.user).toEqual({
        id: 3,
        name: 'Test User',
        email: 'test@example.com'
      })
      expect(body.message).toBe('User created successfully')
    })

    it('should handle PUT request', async () => {
      const request: CliRequest = {
        method: 'PUT',
        path: '/api/users/1',
        headers: {},
        body: { name: 'Updated User', email: 'updated@example.com' },
        query: {}
      }

      const response = await adapter.executeRequest(request)

      expect(response.statusCode).toBe(200)
      
      const body = JSON.parse(response.body)
      expect(body.user).toEqual({
        id: 1,
        name: 'Updated User',
        email: 'updated@example.com'
      })
    })

    it('should handle DELETE request', async () => {
      const request: CliRequest = {
        method: 'DELETE',
        path: '/api/users/1',
        headers: {},
        body: undefined,
        query: {}
      }

      const response = await adapter.executeRequest(request)

      expect(response.statusCode).toBe(200)
      
      const body = JSON.parse(response.body)
      expect(body.user.id).toBe(1)
      expect(body.message).toBe('User deleted successfully')
    })

    it('should handle authorization headers', async () => {
      const request: CliRequest = {
        method: 'GET',
        path: '/api/admin/stats',
        headers: { authorization: 'Bearer valid-token' },
        body: undefined,
        query: {}
      }

      const response = await adapter.executeRequest(request)

      expect(response.statusCode).toBe(200)
      
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('stats')
      expect(body.stats).toHaveProperty('totalUsers')
    })

    it('should handle 404 errors', async () => {
      const request: CliRequest = {
        method: 'GET',
        path: '/nonexistent',
        headers: {},
        body: undefined,
        query: {}
      }

      const response = await adapter.executeRequest(request)

      expect(response.statusCode).toBe(404)
    })

    it('should handle 401 unauthorized', async () => {
      const request: CliRequest = {
        method: 'GET',
        path: '/api/admin/stats',
        headers: {},
        body: undefined,
        query: {}
      }

      const response = await adapter.executeRequest(request)

      expect(response.statusCode).toBe(401)
      
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Unauthorized')
    })

    it('should handle 400 bad request', async () => {
      const request: CliRequest = {
        method: 'POST',
        path: '/api/users',
        headers: {},
        body: { name: 'Test' }, // missing email
        query: {}
      }

      const response = await adapter.executeRequest(request)

      expect(response.statusCode).toBe(400)
      
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Name and email are required')
    })

    it('should handle 500 server errors', async () => {
      const request: CliRequest = {
        method: 'GET',
        path: '/api/error',
        headers: {},
        body: undefined,
        query: {}
      }

      const response = await adapter.executeRequest(request)

      expect(response.statusCode).toBe(500)
      
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Internal server error')
    })
  })

  describe('executeBatch', () => {
    const createRequests = (): CliRequest[] => [
      {
        method: 'GET',
        path: '/health',
        headers: {},
        body: undefined,
        query: {}
      },
      {
        method: 'GET',
        path: '/api/users',
        headers: {},
        body: undefined,
        query: {}
      }
    ]

    it('should execute multiple requests in parallel (default)', async () => {
      const requests = createRequests()
      
      const responses = await adapter.executeBatch(requests)

      expect(responses).toHaveLength(2)
      expect(responses[0].statusCode).toBe(200)
      expect(responses[1].statusCode).toBe(200)
    })

    it('should execute multiple requests in series', async () => {
      const adapterWithOptions = new CliAdapter(app, {
        batchOptions: { parallel: false }
      })
      const requests = createRequests()
      
      const responses = await adapterWithOptions.executeBatch(requests)

      expect(responses).toHaveLength(2)
      expect(responses[0].statusCode).toBe(200)
      expect(responses[1].statusCode).toBe(200)
    })

    it('should handle errors with continueOnError=false (default)', async () => {
      const requests: CliRequest[] = [
        {
          method: 'GET',
          path: '/health',
          headers: {},
          body: undefined,
          query: {}
        },
        {
          method: 'GET',
          path: '/nonexistent',
          headers: {},
          body: undefined,
          query: {}
        }
      ]

      const responses = await adapter.executeBatch(requests)

      expect(responses).toHaveLength(2)
      expect(responses[0].statusCode).toBe(200)
      expect(responses[1].statusCode).toBe(404)
    })

    it('should handle errors with continueOnError=true', async () => {
      const adapterWithOptions = new CliAdapter(app, {
        batchOptions: { continueOnError: true }
      })
      
      const requests: CliRequest[] = [
        {
          method: 'GET',
          path: '/health',
          headers: {},
          body: undefined,
          query: {}
        },
        {
          method: 'GET',
          path: '/nonexistent',
          headers: {},
          body: undefined,
          query: {}
        },
        {
          method: 'GET',
          path: '/api/users',
          headers: {},
          body: undefined,
          query: {}
        }
      ]

      const responses = await adapterWithOptions.executeBatch(requests)

      expect(responses).toHaveLength(3)
      expect(responses[0].statusCode).toBe(200)
      expect(responses[1].statusCode).toBe(404)
      expect(responses[2].statusCode).toBe(200)
    })

    it('should handle mixed success and error responses', async () => {
      const requests: CliRequest[] = [
        {
          method: 'GET',
          path: '/health',
          headers: {},
          body: undefined,
          query: {}
        },
        {
          method: 'POST',
          path: '/api/users',
          headers: {},
          body: { name: 'Test' }, // missing email - will cause 400
          query: {}
        },
        {
          method: 'GET',
          path: '/api/users',
          headers: {},
          body: undefined,
          query: {}
        }
      ]

      const responses = await adapter.executeBatch(requests)

      expect(responses).toHaveLength(3)
      expect(responses[0].statusCode).toBe(200)
      expect(responses[1].statusCode).toBe(400)
      expect(responses[2].statusCode).toBe(200)
    })

    it('should handle empty batch', async () => {
      const responses = await adapter.executeBatch([])
      expect(responses).toHaveLength(0)
    })

    it('should handle batch with authentication', async () => {
      const requests: CliRequest[] = [
        {
          method: 'GET',
          path: '/api/admin/stats',
          headers: { authorization: 'Bearer valid-token' },
          body: undefined,
          query: {}
        },
        {
          method: 'GET',
          path: '/api/admin/stats',
          headers: {}, // no auth - will fail
          body: undefined,
          query: {}
        }
      ]

      const responses = await adapter.executeBatch(requests)

      expect(responses).toHaveLength(2)
      expect(responses[0].statusCode).toBe(200)
      expect(responses[1].statusCode).toBe(401)
    })
  })
})