import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  MockInstance,
  vi,
} from 'vitest'

import { QueryLoggerInterface } from './interfaces'
import { createLogger } from './logger'

describe('query-module / logger', () => {
  let logger: QueryLoggerInterface
  beforeEach(() => {
    logger = createLogger()
  })

  describe('verbose', () => {
    let spy: MockInstance
    beforeEach(() => {
      spy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    })
    afterEach(() => {
      spy.mockClear()
    })

    beforeEach(() => {
      logger.verbose('example')
    })

    it('should be call console.debug', () => {
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('info', () => {
    let spy: MockInstance
    beforeEach(() => {
      spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    })
    afterEach(() => {
      spy.mockClear()
    })

    beforeEach(() => {
      logger.info('example')
    })

    it('should be call console.info', () => {
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('error', () => {
    let spy: MockInstance
    beforeEach(() => {
      spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })
    afterEach(() => {
      spy.mockClear()
    })

    beforeEach(() => {
      logger.error('example', new Error())
    })

    it('should be call console.error', () => {
      expect(spy).toHaveBeenCalled()
    })
  })
})
