import { Adapter } from '../adapter'
import { ServerFunctionArgs, ErrorHandler } from '../interfaces'

export function createAdapter(
  args: ServerFunctionArgs,
  onError?: ErrorHandler,
) {
  return new Adapter(args, onError)
}
