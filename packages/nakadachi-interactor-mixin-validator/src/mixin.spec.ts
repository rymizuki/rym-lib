import { describe, expect, expectTypeOf, it } from 'vitest'
import { z } from 'zod'

import { InputPort } from '@rym-lib/nakadachi'

import { InvalidParameterRequestException } from './exceptions'
import { ValidatorMixin } from './mixin'

class TestInteractor extends ValidatorMixin {
  run(...args: Parameters<ValidatorMixin['validate']>) {
    return this.validate(...args)
  }

  runWith<
    Params extends z.ZodType = z.ZodType<object>,
    Queries extends z.ZodType = z.ZodType<object>,
    Body extends z.ZodType = z.ZodType<object>,
  >(
    input: InputPort,
    rules: { params?: Params; queries?: Queries; body?: Body },
  ) {
    return this.validate(input, rules)
  }
}

const buildInput = (overrides: Partial<InputPort> = {}): InputPort => ({
  params: {},
  queries: {},
  body: {},
  method: 'POST',
  url: new URL('http://localhost/'),
  headers: new Headers(),
  ...overrides,
})

const catchError = (fn: () => unknown): unknown => {
  try {
    fn()
  } catch (error) {
    return error
  }
  return undefined
}

describe('ValidatorMixin', () => {
  const interactor = new TestInteractor()

  describe('validate', () => {
    describe('params のスキーマを指定した場合', () => {
      const rules = { params: z.object({ id: z.string() }) }

      describe('スキーマに合う params のとき', () => {
        it('検証済みの params を返す', () => {
          const result = interactor.runWith(
            buildInput({ params: { id: 'a' } }),
            rules,
          )

          expect(result.params).toEqual({ id: 'a' })
        })

        it('指定したスキーマの出力型が params に付く', () => {
          const result = interactor.runWith(
            buildInput({ params: { id: 'a' } }),
            rules,
          )

          expectTypeOf(result.params).toExtend<{ id: string }>()
        })
      })

      describe('スキーマに合わない params のとき', () => {
        const invalidInput = buildInput({ params: { id: 1 } as never })

        it('InvalidParameterRequestException を投げる', () => {
          expect(() => interactor.runWith(invalidInput, rules)).toThrow(
            InvalidParameterRequestException,
          )
        })

        it('例外の data に渡した params が入る', () => {
          const error = catchError(() =>
            interactor.runWith(invalidInput, rules),
          )

          expect((error as InvalidParameterRequestException).data).toEqual({
            id: 1,
          })
        })

        it('例外の issues が失敗したフィールドの path を指す', () => {
          const error = catchError(() =>
            interactor.runWith(invalidInput, rules),
          )

          expect(
            (error as InvalidParameterRequestException).issues[0]?.path,
          ).toEqual(['id'])
        })
      })
    })

    describe('params に z.object 以外のスキーマを指定した場合', () => {
      describe('z.array のとき', () => {
        it('検証済みの配列を返し、配列の出力型が付く', () => {
          const result = interactor.runWith(
            buildInput({ params: ['a', 'b'] as never }),
            { params: z.array(z.string()) },
          )

          expect(result.params).toEqual(['a', 'b'])
          expectTypeOf(result.params).toEqualTypeOf<string[]>()
        })
      })

      describe('z.record のとき', () => {
        it('検証済みのレコードを返し、レコードの出力型が付く', () => {
          const result = interactor.runWith(
            buildInput({ params: { a: 1 } as never }),
            { params: z.record(z.string(), z.number()) },
          )

          expect(result.params).toEqual({ a: 1 })
          expectTypeOf(result.params).toEqualTypeOf<Record<string, number>>()
        })
      })
    })

    describe('queries のスキーマを指定した場合', () => {
      describe('スキーマに合う queries のとき', () => {
        it('検証済みの queries を返し、出力型が付く', () => {
          const result = interactor.runWith(
            buildInput({ queries: { page: '1' } }),
            { queries: z.object({ page: z.string() }) },
          )

          expect(result.queries).toEqual({ page: '1' })
          expectTypeOf(result.queries).toExtend<{ page: string }>()
        })
      })
    })

    describe('rules を省略した場合', () => {
      it('未知のキーを含む params から未知のキーを取り除いて {} を返す', () => {
        const result = interactor.run(
          buildInput({ params: { unknown: 'x' } }),
          {},
        )

        expect(result.params).toEqual({})
      })
    })

    describe('body のスキーマを指定した場合', () => {
      const rules = { body: z.object({ name: z.string() }) }

      describe('スキーマに合う body のとき', () => {
        it('検証済みの body を返し、出力型が付く', () => {
          const result = interactor.runWith(
            buildInput({ body: { name: 'taro' } }),
            rules,
          )

          expect(result.body).toEqual({ name: 'taro' })
          expectTypeOf(result.body).toExtend<{ name: string }>()
        })
      })

      describe('input.body が undefined のとき', () => {
        it('{} を検証し、必須フィールドがあれば例外を投げる', () => {
          expect(() =>
            interactor.runWith(buildInput({ body: undefined }), rules),
          ).toThrow(InvalidParameterRequestException)
        })

        it('必須フィールドがなければ {} を返す', () => {
          const result = interactor.runWith(buildInput({ body: undefined }), {
            body: z.object({ name: z.string().optional() }),
          })

          expect(result.body).toEqual({})
        })
      })
    })
  })
})
