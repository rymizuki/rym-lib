import 'reflect-metadata'

import { inject, injectable } from '@rym-lib/inversify-bundler'

import {
  Task,
  TaskServiceIdentifier,
  TaskServiceModule,
  TaskServicePort,
} from '~/server/domains/task'
import {
  createInteractor,
  InteractionPort,
  DoneFunction,
  InputPort,
  NakadachiContext,
} from '~/server/interactor'

export interface LoaderData {
  taskList: { items: Task[] }
}

@injectable()
class Loader implements InteractionPort<LoaderData> {
  constructor(
    @inject(TaskServiceIdentifier)
    private taskService: TaskServicePort,
  ) {}

  async interact(
    done: DoneFunction<LoaderData>,
    input: InputPort,
    context: NakadachiContext,
  ): Promise<void> {
    const taskList = await this.taskService.findAll()

    done({
      data: {
        taskList,
      },
    })
  }
}

export const { interactor: loader } = createInteractor('Loader', Loader, [
  TaskServiceModule,
])
