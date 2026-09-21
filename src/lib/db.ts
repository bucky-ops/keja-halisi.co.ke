import { PrismaClient } from '@prisma/client'

// NOTE: key is versioned (kejaPrismaV3) so dev-server HMR picks up regenerated
// Prisma clients (new models/fields) instead of reusing a stale global instance.
// Bump whenever the Prisma schema changes and restart the dev server.
const globalForPrisma = globalThis as unknown as {
  kejaPrismaV3: PrismaClient | undefined
}

export const db =
  globalForPrisma.kejaPrismaV3 ??
  new PrismaClient({
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.kejaPrismaV3 = db
