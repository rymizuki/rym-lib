import { beforeEach } from 'vitest'
import { vi } from 'vitest'
import { DeepMockProxy, mockDeep, mockReset } from 'vitest-mock-extended'

import { PrismaClient } from '@prisma/client'

import prisma from './prisma'

vi.mock('./prisma', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}))

beforeEach(() => {
  mockReset(prismaMock)
})

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>
