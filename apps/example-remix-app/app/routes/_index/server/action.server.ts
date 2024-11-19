import 'reflect-metadata'

import { z } from 'zod'

import { inject, injectable } from '@rym-lib/inversify-bundler'
import { ValidatorMixin } from '@rym-lib/nakadachi-interactor-mixin-validator'

import {
  IdentifierServiceIdentifier,
  IdentifierServiceModule,
  IdentifierServicePort,
} from '~/server/domains/identifier'
import {
  TaskServiceIdentifier,
  TaskServiceModule,
  TaskServicePort,
} from '~/server/domains/task'
import {
  createInteractor,
  DoneFunction,
  InputPort,
  InteractionPort,
  NakadachiContext,
} from '~/server/interactor'

export interface ActionData {
  status: 'succeeded'
  data: {
    id: string
  }
}

@injectable()
class Action extends ValidatorMixin implements InteractionPort<ActionData> {
  constructor(
    @inject(IdentifierServiceIdentifier)
    private identifierService: IdentifierServicePort,
    @inject(TaskServiceIdentifier)
    private taskService: TaskServicePort,
  ) {
    super()
  }

  async interact(
    done: DoneFunction<ActionData>,
    input: InputPort,
    context: NakadachiContext,
  ): Promise<void> {
    const { body } = this.validate(input, {
      body: z.object({
        subject: z.string().min(1).max(127),
        content: z.string().min(1).max(3_600),
      }),
    })

    const id = await this.identifierService.generateId()
    await this.taskService.save({
      id,
      subject: body.subject,
      content: body.content,
      created_at: new Date(),
      updated_at: new Date(),
    })

    done({
      data: {
        status: 'succeeded',
        data: {
          id,
        },
      },
    })
  }
}

export const { interactor: action } = createInteractor('Action', Action, [
  TaskServiceModule,
  IdentifierServiceModule,
])
