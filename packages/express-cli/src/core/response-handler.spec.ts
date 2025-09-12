import { describe, it, expect } from 'vitest'
import { ResponseHandler } from './response-handler.js'
import type { CliResponse } from '../types/index.js'

describe('ResponseHandler', () => {
  describe('createMockResponse', () => {
    it('should create a mock response with default values', () => {
      const { response, getResult } = ResponseHandler.createMockResponse()
      
      const result = getResult()
      expect(result).toEqual({
        statusCode: 200,
        headers: {},
        body: ''
      })
    })

    it('should handle status() calls', () => {
      const { response, getResult } = ResponseHandler.createMockResponse()
      
      response.status!(404)
      
      const result = getResult()
      expect(result.statusCode).toBe(404)
    })

    it('should handle set() calls with key-value pairs', () => {
      const { response, getResult } = ResponseHandler.createMockResponse()
      
      response.set!('content-type', 'application/json')
      response.set!('Authorization', 'Bearer token')
      
      const result = getResult()
      expect(result.headers).toEqual({
        'content-type': 'application/json',
        'authorization': 'Bearer token'
      })
    })

    it('should handle set() calls with object', () => {
      const { response, getResult } = ResponseHandler.createMockResponse()
      
      response.set!({
        'Content-Type': 'application/json',
        'X-Custom-Header': 'custom-value'
      })
      
      const result = getResult()
      expect(result.headers).toEqual({
        'content-type': 'application/json',
        'x-custom-header': 'custom-value'
      })
    })

    it('should handle json() calls', () => {
      const { response, getResult } = ResponseHandler.createMockResponse()
      
      const data = { message: 'success', id: 123 }
      response.json!(data)
      
      const result = getResult()
      expect(result.headers['content-type']).toBe('application/json')
      expect(result.body).toBe(JSON.stringify(data))
    })

    it('should handle send() calls with string', () => {
      const { response, getResult } = ResponseHandler.createMockResponse()
      
      response.send!('Hello World')
      
      const result = getResult()
      expect(result.headers['content-type']).toBe('text/plain')
      expect(result.body).toBe('Hello World')
    })

    it('should handle send() calls with object', () => {
      const { response, getResult } = ResponseHandler.createMockResponse()
      
      const data = { message: 'test' }
      response.send!(data)
      
      const result = getResult()
      expect(result.headers['content-type']).toBe('application/json')
      expect(result.body).toBe(JSON.stringify(data))
    })

    it('should handle send() calls when content-type already set', () => {
      const { response, getResult } = ResponseHandler.createMockResponse()
      
      response.set!('content-type', 'text/html')
      response.send!('HTML content')
      
      const result = getResult()
      expect(result.headers['content-type']).toBe('text/html')
      expect(result.body).toBe('HTML content')
    })

    it('should handle chained calls', () => {
      const { response, getResult } = ResponseHandler.createMockResponse()
      
      response.status!(201).set!('location', '/api/users/123').json!({ id: 123, created: true })
      
      const result = getResult()
      expect(result).toEqual({
        statusCode: 201,
        headers: {
          'location': '/api/users/123',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ id: 123, created: true })
      })
    })

    it('should handle end() calls', () => {
      const { response, getResult } = ResponseHandler.createMockResponse()
      
      response.status!(204).end!()
      
      const result = getResult()
      expect(result).toEqual({
        statusCode: 204,
        headers: {},
        body: ''
      })
    })

    it('should handle complex response scenario', () => {
      const { response, getResult } = ResponseHandler.createMockResponse()
      
      response
        .status!(400)
        .set!({
          'Content-Type': 'application/json',
          'X-Error-Code': 'VALIDATION_ERROR'
        })
        .json!({
          error: 'Validation failed',
          details: ['Email is required', 'Password too short']
        })
      
      const result = getResult()
      expect(result).toEqual({
        statusCode: 400,
        headers: {
          'content-type': 'application/json',
          'x-error-code': 'VALIDATION_ERROR'
        },
        body: JSON.stringify({
          error: 'Validation failed',
          details: ['Email is required', 'Password too short']
        })
      })
    })
  })

  describe('formatOutput', () => {
    const createResponse = (overrides: Partial<CliResponse> = {}): CliResponse => ({
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'success' }),
      ...overrides
    })

    describe('normal mode (verbose=false)', () => {
      it('should format JSON response', () => {
        const response = createResponse()
        const output = ResponseHandler.formatOutput(response, false)
        
        expect(output).toBe('{\n  "message": "success"\n}')
      })

      it('should format plain text response', () => {
        const response = createResponse({
          headers: { 'content-type': 'text/plain' },
          body: 'Hello World'
        })
        const output = ResponseHandler.formatOutput(response, false)
        
        expect(output).toBe('Hello World')
      })

      it('should handle non-JSON content-type with JSON body', () => {
        const response = createResponse({
          headers: { 'content-type': 'text/html' },
          body: JSON.stringify({ data: 'test' })
        })
        const output = ResponseHandler.formatOutput(response, false)
        
        expect(output).toBe('{"data":"test"}')
      })

      it('should handle invalid JSON gracefully', () => {
        const response = createResponse({
          headers: { 'content-type': 'application/json' },
          body: '{invalid json}'
        })
        const output = ResponseHandler.formatOutput(response, false)
        
        expect(output).toBe('{invalid json}')
      })

      it('should handle empty body', () => {
        const response = createResponse({
          body: ''
        })
        const output = ResponseHandler.formatOutput(response, false)
        
        expect(output).toBe('')
      })
    })

    describe('verbose mode (verbose=true)', () => {
      it('should include status code and headers', () => {
        const response = createResponse({
          statusCode: 201,
          headers: {
            'content-type': 'application/json',
            'location': '/api/users/123'
          }
        })
        const output = ResponseHandler.formatOutput(response, true)
        
        const parsed = JSON.parse(output)
        expect(parsed).toEqual({
          statusCode: 201,
          headers: {
            'content-type': 'application/json',
            'location': '/api/users/123'
          },
          body: { message: 'success' }
        })
      })

      it('should handle error responses in verbose mode', () => {
        const response = createResponse({
          statusCode: 404,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ error: 'Not found' })
        })
        const output = ResponseHandler.formatOutput(response, true)
        
        const parsed = JSON.parse(output)
        expect(parsed).toEqual({
          statusCode: 404,
          headers: { 'content-type': 'application/json' },
          body: { error: 'Not found' }
        })
      })

      it('should handle non-JSON body in verbose mode', () => {
        const response = createResponse({
          headers: { 'content-type': 'text/plain' },
          body: 'Plain text content'
        })
        const output = ResponseHandler.formatOutput(response, true)
        
        const parsed = JSON.parse(output)
        expect(parsed).toEqual({
          statusCode: 200,
          headers: { 'content-type': 'text/plain' },
          body: 'Plain text content'
        })
      })

      it('should handle empty body in verbose mode', () => {
        const response = createResponse({
          statusCode: 204,
          headers: {},
          body: ''
        })
        const output = ResponseHandler.formatOutput(response, true)
        
        const parsed = JSON.parse(output)
        expect(parsed).toEqual({
          statusCode: 204,
          headers: {},
          body: ''
        })
      })

      it('should handle complex nested JSON in verbose mode', () => {
        const complexData = {
          users: [
            { id: 1, name: 'John' },
            { id: 2, name: 'Jane' }
          ],
          meta: {
            total: 2,
            pagination: { page: 1, limit: 10 }
          }
        }
        const response = createResponse({
          body: JSON.stringify(complexData)
        })
        const output = ResponseHandler.formatOutput(response, true)
        
        const parsed = JSON.parse(output)
        expect(parsed.body).toEqual(complexData)
      })
    })

    describe('edge cases', () => {
      it('should handle undefined content-type', () => {
        const response = createResponse({
          headers: {},
          body: 'some content'
        })
        const output = ResponseHandler.formatOutput(response, false)
        
        expect(output).toBe('some content')
      })

      it('should handle content-type with charset', () => {
        const response = createResponse({
          headers: { 'content-type': 'application/json; charset=utf-8' }
        })
        const output = ResponseHandler.formatOutput(response, false)
        
        expect(output).toBe('{\n  "message": "success"\n}')
      })

      it('should handle case-insensitive content-type', () => {
        const response = createResponse({
          headers: { 'Content-Type': 'APPLICATION/JSON' }
        })
        const output = ResponseHandler.formatOutput(response, false)
        
        expect(output).toBe('{\n  "message": "success"\n}')
      })
    })
  })
})