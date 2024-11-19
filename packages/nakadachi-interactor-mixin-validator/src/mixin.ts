import { ZodSchema, z } from 'zod'

import { injectable } from '@rym-lib/inversify-bundler'
import { InputPort } from '@rym-lib/nakadachi'

import { InvalidParameterRequestException } from './exceptions'

@injectable()
abstract class ValidatorMixin {
  protected validate<
    Params extends ZodSchema = ZodSchema<object>,
    Queries extends ZodSchema = ZodSchema<object>,
    Body extends ZodSchema = ZodSchema<object>,
  >(
    input: InputPort,
    rules: {
      params?: Params
      queries?: Queries
      body?: Body
    },
  ) {
    const validators = Object.assign(
      {
        params: z.object({}),
        queries: z.object({}),
        body: z.object({}),
      },
      rules,
    )

    const validate = <Schema extends ZodSchema>(
      data: unknown,
      validator: Schema,
    ): ReturnType<Schema['parse']> => {
      const ret = validator.safeParse(data)
      if (!ret.success) {
        throw new InvalidParameterRequestException(data, ret.error.issues)
      }
      return ret.data
    }

    return {
      params: validate(input.params, validators.params),
      queries: validate(input.queries, validators.queries),
      body: validate(input.body || {}, validators.body),
    }
  }
}

export { ValidatorMixin }
