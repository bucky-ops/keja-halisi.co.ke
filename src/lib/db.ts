import { PrismaClient } from '@prisma/client'

// NOTE: key is versioned (kejaPrismaV2) so dev-server HMR picks up regenerated
// Prisma clients (new models) instead of reusing a stale global instance.
const globalForPrisma = globalThis as unknown as {
  kejaPrismaV2: PrismaClient | undefined
}

export const db =
  globalForPrisma.kejaPrismaV2 ??
  new PrismaClient({
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.kejaPrismaV2 = db