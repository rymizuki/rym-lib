import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { NakadachiTimeoutException } from './exceptions'
import {
  InputPort,
  NakadachiAdapterInterface,
  NakadachiRequestHandler,
  NakadachiResult,
} from './interfaces'
import { Nakadachi } from './nakadachi'

const buildFakeAdapter = (): NakadachiAdapterInterface<NakadachiResult> => ({
  createInput: async () => ({}) as InputPort,
  createContext: (context) => ({ options: { timeout: 0 }, ...context }),
  createResponse: async (result) => result,
})

const TIMEOUT_MS = 50

const buildTarget = () =>
  new Nakadachi<NakadachiResult>(buildFakeAdapter(), { timeout: TIMEOUT_MS })

describe('Nakadachi', () => {
  describe('interact', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    describe('handler が done に結果を渡した場合', () => {
      it('渡した結果をそのまま返す', async () => {
        const result = await buildTarget().interact(async (done) => {
          done({ data: 'X' })
        })
        expect(result).toEqual({ data: 'X' })
      })
    })

    describe('handler が done を引数なしで呼んだ場合', () => {
      it('status 204 で data が null の結果を返す', async () => {
        const result = await buildTarget().interact(async (done) => {
          done()
        })
        expect(result).toEqual({ data: null, status: 204 })
      })
    })

    describe('handler が非同期に例外を投げた場合', () => {
      it('投げた error をそのまま error として返す', async () => {
        const thrown = new Error('boom')
        const result = await buildTarget().interact(async () => {
          throw thrown
        })
        expect(result).toHaveProperty('error', thrown)
      })
    })

    describe('handler が同期的に例外を投げた場合', () => {
      it('投げた error をそのまま error として返す', async () => {
        const thrown = new Error('sync boom')
        const handler: NakadachiRequestHandler = () => {
          throw thrown
        }
        const result = await buildTarget().interact(handler)
        expect(result).toHaveProperty('error', thrown)
      })
    })

    describe('handler が done を呼ばずに終わった場合', () => {
      it('timeout 経過後に NakadachiTimeoutException を error として返す', async () => {
        const pending = buildTarget().interact(async () => {})
        await vi.advanceTimersByTimeAsync(TIMEOUT_MS)
        const result = await pending
        expect(result).toEqual({
          error: expect.any(NakadachiTimeoutException),
        })
      })
    })

    describe('handler が timeout より前に done した場合', () => {
      it('完了後にタイマーが残らない', async () => {
        await buildTarget().interact(async (done) => {
          done({ data: 'X' })
        })
        expect(vi.getTimerCount()).toBe(0)
      })
    })

    describe('handler が例外を投げて終わった場合', () => {
      it('完了後にタイマーが残らない', async () => {
        await buildTarget().interact(async () => {
          throw new Error('boom')
        })
        expect(vi.getTimerCount()).toBe(0)
      })
    })

    describe('handler が done したあとに例外を投げた場合', () => {
      it('先に確定した done の結果を返す', async () => {
        const result = await buildTarget().interact(async (done) => {
          done({ data: 'X' })
          throw new Error('late boom')
        })
        expect(result).toEqual({ data: 'X' })
      })
    })
  })
})
