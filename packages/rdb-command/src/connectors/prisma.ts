import { PrismaClient } from '@prisma/client'
import { ITXClientDenyList } from '@prisma/client/runtime/library'

import { DataBaseConnectorPort, TransactionCallback } from '../interfaces'

type TxnPrismaClient = Omit<PrismaClient, ITXClientDenyList>
export class PrismaConnector implements DataBaseConnectorPort {
  constructor(private prisma: PrismaClient | TxnPrismaClient) {}

  async execute(sql: string, replacements: unknown[]): Promise<void> {
    await this.prisma.$executeRawUnsafe(sql, ...replacements)
  }

  async query<T>(sql: string, replacements: unknown[]): Promise<T> {
    return (await this.prisma.$queryRawUnsafe(sql, ...replacements)) as T
  }

  async transaction(exec: TransactionCallback): Promise<void> {
    if ('$transaction' in this.prisma) {
      await this.prisma.$transaction(async (prisma: TxnPrismaClient) => {
        await exec(new PrismaConnector(prisma))
      })
    } else {
      return await exec(this)
    }
  }
}
