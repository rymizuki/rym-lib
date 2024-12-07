import 'reflect-metadata'

import { it, beforeEach, describe, expect } from 'vitest'

import {
  Container,
  ContainerInterface,
  injectable,
} from '@rym-lib/inversify-bundler'
import { DoneFunction, InputPort, NakadachiContext } from '@rym-lib/nakadachi'

import { MethodNotAllowedException } from './exceptions'
import { App, builder, InteractionPort } from './interactor'
import { MockAdapter } from './test-helpers/mock-adapter'

describe('Interactor', () => {
  let container: ContainerInterface
  let app: App<any, null, MockAdapter>

  beforeEach(() => {
    container = new Container()
    app = builder(
      (args: { request: Request }) => new MockAdapter(args, container),
    )
  })

  describe('createInteractor', () => {
    describe('case single interaction', () => {
      it('should be process MockInteractor', async () => {
        const { interactor } = app.createInteractor('Test', MockInteractor, [])
        expect(
          await interactor({
            request: new Request('http://example.com/'),
          }),
        ).toStrictEqual({
          data: {
            status: 'succeeded',
          },
        })
      })
    })
  })
})

type MockInteractionData = {
  status: 'succeeded'
}

@injectable()
class MockInteractor implements InteractionPort<MockInteractionData> {
  async interact(
    done: DoneFunction<MockInteractionData>,
    input: InputPort,
    context: NakadachiContext,
  ): Promise<void> {
    done({
      data: {
        status: 'succeeded',
      },
    })
  }
}
