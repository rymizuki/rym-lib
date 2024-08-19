import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  TypedResponse,
} from '@remix-run/node'
import {
  InputPort,
  NakadachiContext,
  NakadachiResponse,
} from '@rym-lib/nakadachi'

export type ServerFunctionArgs = LoaderFunctionArgs | ActionFunctionArgs

export interface ErrorHandler {
  (
    error: unknown,
    input: InputPort,
    context: NakadachiContext,
    response: NakadachiResponse,
  ): TypedResponse
}
