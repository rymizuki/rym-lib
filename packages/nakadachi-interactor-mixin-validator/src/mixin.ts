import { ZodType, z } from 'zod'

import { injectable } from '@rym-lib/inversify-bundler'
import { InputPort } from '@rym-lib/nakadachi'

import { InvalidParameterRequestException } from './exceptions'

type Validated<
  Params extends ZodType,
  Queries extends ZodType,
  Body extends ZodType,
> = {
  params: z.output<Params>
  queries: z.output<Queries>
  body: z.output<Body>
}

@injectable()
abstract class ValidatorMixin {
  protected validate<
    Params extends ZodType = ZodType<object>,
    Queries extends ZodType = ZodType<object>,
    Body extends ZodType = ZodType<object>,
  >(
    input: InputPort,
    rules: {
      params?: Params
      queries?: Queries
      body?: Body
    },
  ): Validated<Params, Queries, Body> {
    const validate = (data: unknown, validator: ZodType) => {
      const ret = validator.safeParse(data)
      if (!ret.success) {
        throw new InvalidParameterRequestException(data, ret.error.issues)
      }
      return ret.data
    }

    return {
      params: validate(input.params, rules.params ?? z.object({})),
      queries: validate(input.queries, rules.queries ?? z.object({})),
      body: validate(input.body || {}, rules.body ?? z.object({})),
    } as Validated<Params, Queries, Body>
  }
}

export { ValidatorMixin }
