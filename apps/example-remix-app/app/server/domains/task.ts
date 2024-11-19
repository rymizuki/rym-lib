import { createModule, injectable } from '@rym-lib/inversify-bundler'

interface ServicePort {
  findById(id: string): Promise<Task | null>
  findAll(): Promise<{ items: Task[] }>
  save(task: Task): Promise<void>
}

export interface Task {
  id: string
  subject: string
  content: string
  created_at: Date
  updated_at: Date
}

// This is on memory store
const data: {
  items: Task[]
} = { items: [] }

@injectable()
class Service implements ServicePort {
  constructor() {}

  async save(task: Task): Promise<void> {
    data.items.push(task)
  }

  async findAll(): Promise<{ items: Task[] }> {
    return {
      items: data.items.reverse(),
    }
  }

  async findById(id: string): Promise<Task | null> {
    const item = data.items.find((task) => task.id === id)
    return item ?? null
  }
}

export const { identifier: TaskServiceIdentifier, bundler: TaskServiceModule } =
  createModule('TaskService', Service, [])
export type { ServicePort as TaskServicePort }
