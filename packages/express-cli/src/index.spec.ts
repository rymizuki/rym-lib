import { describe, it, expect, beforeEach, vi } from 'vitest'
import { expressCli, CliAdapter, RequestBuilder } from './index.js'
import { createMockExpressApp } from './test-utils/mock-express-app.js'

describe('expressCli', () => {
  let app: ReturnType<typeof createMockExpressApp>
  let program: ReturnType<typeof expressCli>

  beforeEach(() => {
    app = createMockExpressApp()
    program = expressCli(app)
  })

  describe('program configuration', () => {
    it('should create a Commander program with correct metadata', () => {
      expect(program.name()).toBe('express-cli')
      expect(program.description()).toBe('Execute Express routes from command line')
      expect(program.version()).toBe('0.0.0')
    })

    it('should have expressCli method for chaining', () => {
      expect(typeof program.expressCli).toBe('function')
    })

    it('should allow creating new instance with different app', () => {
      const newApp = createMockExpressApp()
      const newProgram = program.expressCli(newApp)
      
      expect(newProgram).toBeDefined()
      expect(newProgram.name()).toBe('express-cli')
    })

    it('should have correct options configured', () => {
      const options = program.options.map(opt => opt.long)
      expect(options).toContain('--method')
      expect(options).toContain('--headers')
      expect(options).toContain('--header')
      expect(options).toContain('--body')
      expect(options).toContain('--query')
      expect(options).toContain('--verbose')
    })

    it('should allow unknown options for query parameters', () => {
      expect(program._allowUnknownOption).toBe(true)
    })
  })

  describe('integration with CliAdapter', () => {
    it('should work with Express app through CliAdapter', async () => {
      const adapter = new CliAdapter(app)
      
      const request = RequestBuilder.fromCliArgs('/health', { method: 'GET' })
      const response = await adapter.executeRequest(request)
      
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('status', 'ok')
    })

    it('should handle POST requests with body', async () => {
      const adapter = new CliAdapter(app)
      
      const request = RequestBuilder.fromCliArgs('/api/users', {
        method: 'POST',
        body: '{"name":"Test User","email":"test@example.com"}'
      })
      const response = await adapter.executeRequest(request)
      
      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.user.name).toBe('Test User')
    })

    it('should handle headers with new syntax', async () => {
      const adapter = new CliAdapter(app)
      
      const request = RequestBuilder.fromCliArgs('/api/admin/stats', {
        header: 'authorization: Bearer valid-token'
      })
      const response = await adapter.executeRequest(request)
      
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('stats')
    })

    it('should handle query parameters', async () => {
      const adapter = new CliAdapter(app)
      
      const request = RequestBuilder.fromCliArgs('/api/users', {
        limit: '1',
        offset: '0'
      })
      const response = await adapter.executeRequest(request)
      
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.users).toHaveLength(1)
      expect(body.pagination).toEqual({ limit: 1, offset: 0 })
    })

    it('should handle space-separated paths', async () => {
      const adapter = new CliAdapter(app)
      
      const request = RequestBuilder.fromCliArgs('api users', {})
      const response = await adapter.executeRequest(request)
      
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('users')
    })

    it('should handle batch processing', async () => {
      const adapter = new CliAdapter(app)
      
      const requests = [
        RequestBuilder.fromCliArgs('/health', {}),
        RequestBuilder.fromCliArgs('/api/users', {})
      ]
      
      const responses = await adapter.executeBatch(requests)
      
      expect(responses).toHaveLength(2)
      expect(responses[0].statusCode).toBe(200)
      expect(responses[1].statusCode).toBe(200)
    })

    it('should handle error responses correctly', async () => {
      const adapter = new CliAdapter(app)
      
      const request = RequestBuilder.fromCliArgs('/api/users/999', {})
      const response = await adapter.executeRequest(request)
      
      expect(response.statusCode).toBe(404)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('User not found')
    })
  })

  describe('component integration', () => {
    it('should integrate RequestBuilder with CliAdapter', () => {
      const request = RequestBuilder.fromCliArgs('api users', {
        method: 'GET',
        header: 'authorization: Bearer token',
        limit: '10'
      })
      
      expect(request.path).toBe('/api/users')
      expect(request.method).toBe('GET')
      expect(request.headers.authorization).toBe('Bearer token')
      expect(request.query.limit).toBe('10')
    })
    
    it('should work end-to-end with all new features', async () => {
      const adapter = new CliAdapter(app)
      
      const request = RequestBuilder.fromCliArgs('api admin stats', {
        method: 'GET',
        header: ['authorization: Bearer valid-token', 'content-type: application/json'],
        verbose: 'true'
      })
      
      const response = await adapter.executeRequest(request)
      
      expect(response.statusCode).toBe(200)
      expect(request.path).toBe('/api/admin/stats')
      expect(request.headers.authorization).toBe('Bearer valid-token')
      expect(request.headers['content-type']).toBe('application/json')
    })
  })
})