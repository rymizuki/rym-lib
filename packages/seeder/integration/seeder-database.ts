import { Seeder } from '../src'
import type { SeederOptions } from '../src'
import type { Dialect, IntegrationClient } from './dialects'

type SeederClient = ConstructorParameters<typeof Seeder>[0]

export class SeederDatabase {
  readonly client: IntegrationClient

  constructor(private readonly dialect: Dialect) {
    this.client = dialect.createClient()
  }

  createSeeder(options: SeederOptions = this.dialect.options): Seeder {
    // XXX: 生成先が方言ごとに異なる PrismaClient を、Seeder が受ける @prisma/client の型へ寄せる
    return new Seeder(this.client as unknown as SeederClient, options)
  }

  async reset(): Promise<void> {
    for (const table of this.dialect.tables)
      await this.client.$executeRawUnsafe(`DROP TABLE IF EXISTS ${table}`)
    for (const statement of this.dialect.createStatements)
      await this.client.$executeRawUnsafe(statement)
  }

  async execute(sql: string): Promise<void> {
    await this.client.$executeRawUnsafe(sql)
  }

  async select<Row>(sql: string): Promise<Row[]> {
    return (await this.client.$queryRawUnsafe(sql)) as Row[]
  }

  async disconnect(): Promise<void> {
    await this.client.$disconnect()
  }
}
