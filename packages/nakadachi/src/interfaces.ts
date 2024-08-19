import { Events } from './lib/events'

export interface Queries {
  [key: string]: undefined | string | string[] | Queries | Queries[]
}
export interface Params {
  [key: string]: string | undefined
}
export type RequestBody = any

export interface InputPort {
  params: Params
  queries: Queries
  body: RequestBody
  method: Request['method']
  url: URL
  headers: Request['headers']
}

type ResponseData = any
type ContentType = string
export type NakadachiResult<Data = ResponseData> =
  | {
      redirect: string
      status?: number
    }
  | {
      data: Data
      status?: number
      contentType?: ContentType
    }
  | {
      error: unknown
    }
export interface DoneFunction<Data> {
  (result?: NakadachiResult<Data>): void
}

export interface NakadachiRequestHandler<Data = any> {
  (
    done: DoneFunction<Data>,
    input: InputPort,
    context: NakadachiContext,
  ): Promise<void>
}

export interface NakadachiOption {
  timeout: number
}

export interface NakadachiContext {
  options: NakadachiOption
}

export interface NakadachiResponse extends Omit<ResponseInit, 'headers'> {
  headers: Headers
}

export interface NakadachiInterface<OutputPort, E extends Events = {}> {
  on<Name extends keyof E, Prop extends E[Name]>(
    name: Name,
    fn: (prop: Prop) => Promise<void>,
  ): void
  interact(handler: NakadachiRequestHandler): Promise<OutputPort>
}

export interface NakadachiAdapterInterface<OutputPort> {
  createInput(): Promise<InputPort>
  createContext(context: Partial<NakadachiContext>): NakadachiContext
  createResponse(
    result: NakadachiResult,
    input: InputPort,
    context: NakadachiContext,
    response: NakadachiResponse,
  ): Promise<OutputPort>
}
