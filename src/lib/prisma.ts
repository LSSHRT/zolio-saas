import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

// Custom interface to extend Prisma with user-specific context
export interface PrismaContext {
  userId?: string;
  isAdmin?: boolean;
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createExtendedClient> | undefined
}

function createExtendedClient(context?: PrismaContext) {
  const baseClient = new PrismaClient({
    log: ['error'],
    datasourceUrl: process.env.DATABASE_URL,
  });

  return baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // 1. Soft Delete - Filter out deleted records by default
          if (
            ['findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy'].includes(operation)
          ) {
            const modelMeta = (baseClient as any)._runtimeDataModel.models[model];
            if (modelMeta?.fields.some((f: any) => f.name === 'deletedAt')) {
              args.where = { ...args.where, deletedAt: null };
            }
          }

          // 2. Multi-tenancy - Filter by userId if provided and model has userId
          if (context?.userId && !context.isAdmin) {
            const modelMeta = (baseClient as any)._runtimeDataModel.models[model];
            if (modelMeta?.fields.some((f: any) => f.name === 'userId')) {
              // Ensure we don't bypass userId for read/update/delete operations
              args.where = { ...args.where, userId: context.userId };
              
              // For create/upsert, ensure userId is set correctly
              if (operation === 'create') {
                args.data = { ...args.data, userId: context.userId };
              } else if (operation === 'upsert') {
                args.create = { ...args.create, userId: context.userId };
                args.update = { ...args.update, userId: context.userId };
              }
            }
          }

          return query(args);
        },
      },
    },
    model: {
      $allModels: {
        async softDelete(id: string) {
          const model = (this as any).name;
          return (baseClient as any)[model].update({
            where: { id },
            data: { deletedAt: new Date() },
          });
        },
        async restore(id: string) {
          const model = (this as any).name;
          return (baseClient as any)[model].update({
            where: { id },
            data: { deletedAt: null },
          });
        }
      }
    }
  });
}

export const prisma = globalForPrisma.prisma ?? createExtendedClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Get a Prisma client scoped to a specific user.
 * This ensures multi-tenancy at the query level.
 */
export function getScopedPrisma(userId: string, isAdmin = false) {
  return createExtendedClient({ userId, isAdmin });
}

export { Decimal };
