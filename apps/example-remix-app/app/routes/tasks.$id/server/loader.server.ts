import 'reflect-metadata'

import { z } from 'zod'

import { inject, injectable } from '@rym-lib/inversify-bundler'
import { ValidatorMixin } from '@rym-lib/nakadachi-interactor-mixin-validator'

import {
  Task,
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

export interface LoaderData {
  task: Task | null
}

@injectable()
class Loader extends ValidatorMixin implements InteractionPort<LoaderData> {
  constructor(
    @inject(TaskServiceIdentifier)
    private taskService: TaskServicePort,
  ) {
    super()
  }

  async interact(
    done: DoneFunction<LoaderData>,
    input: InputPort,
    context: NakadachiContext,
  ): Promise<void> {
    const { params } = this.validate(input, {
      params: z.object({
        id: z
          .string()
          .min(1)
          .regex(/[0-9]+/),
      }),
    })
    const task = await this.taskService.findById(params.id)

    done({
      data: {
        task,
      },
    })
  }
}

export const { interactor: loader } = createInteractor('Loader', Loader, [
  TaskServiceModule,
])
