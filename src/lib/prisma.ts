import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

// Custom interface to extend Prisma with user-specific context
export interface PrismaContext {
  userId?: string;
  isAdmin?: boolean;
}

// Minimal typings for the bits of the Prisma runtime / dynamic delegates we touch.
type FieldMeta = { name: string };
type ModelMeta = { fields: FieldMeta[] };
type RuntimeModel = { _runtimeDataModel: { models: Record<string, ModelMeta> } };
type QueryArgs = Record<string, unknown>;
type ModelDelegate = {
  findUnique: (args: QueryArgs) => Promise<Record<string, unknown> | null>;
  update: (args: QueryArgs) => Promise<unknown>;
};
type DynamicClient = Record<string, ModelDelegate>;

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createExtendedClient> | undefined
}

function createExtendedClient(context?: PrismaContext) {
 // Build connection URL with expanded pool for concurrent API usage
 const databaseUrl = process.env.DATABASE_URL ?? '';
 let datasourceUrl = databaseUrl;

 try {
   const url = new URL(databaseUrl);
   // Expand pool to handle concurrent connections across API routes
   url.searchParams.set('connection_limit', '10');
   url.searchParams.set('pool_timeout', '30');
   datasourceUrl = url.toString();
 } catch {
   // Fallback: use as-is if URL parsing fails
 }

 const baseClient = new PrismaClient({
  log: ['error'],
  datasourceUrl,
 });

 const runtimeModels = (baseClient as unknown as RuntimeModel)._runtimeDataModel.models;
 const dynamicClient = baseClient as unknown as DynamicClient;

  return baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: {
          model: string;
          operation: string;
          args: QueryArgs;
          query: (args: QueryArgs) => Promise<unknown>;
        }) {
          // 1. Soft Delete - Filter out deleted records by default
          if (
            ['findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy'].includes(operation)
          ) {
            const modelMeta = runtimeModels[model];
            if (modelMeta?.fields.some((f) => f.name === 'deletedAt')) {
              args.where = { ...asRecord(args.where), deletedAt: null };
            }
          }

          // 2. Multi-tenancy - Filter by userId if provided and model has userId
          if (context?.userId && !context.isAdmin) {
            const modelMeta = runtimeModels[model];
            if (modelMeta?.fields.some((f) => f.name === 'userId')) {
              // Ensure we don't bypass userId for read/update/delete operations
              args.where = { ...asRecord(args.where), userId: context.userId };

              // For create/upsert, ensure userId is set correctly
              if (operation === 'create') {
                args.data = { ...asRecord(args.data), userId: context.userId };
              } else if (operation === 'upsert') {
                args.create = { ...asRecord(args.create), userId: context.userId };
                args.update = { ...asRecord(args.update), userId: context.userId };
              }
            }
          }

          // 3. Handle Soft Delete unique constraint conflict
          // Note: Suffix handling moved to model extension 'softDelete' for better control
          // but we still ensure 'userId' is not bypassed.

          return query(args);
        },
      },
    },
    model: {
      $allModels: {
        async softDelete(id: string) {
          const model = (this as unknown as { name: string }).name;
          const modelMeta = runtimeModels[model];

          const data: Record<string, unknown> = { deletedAt: new Date() };

          // Handle unique 'numero' constraint for soft deleted records
          if (modelMeta?.fields.some((f) => f.name === 'numero')) {
            const existing = await dynamicClient[model].findUnique({
              where: { id },
              select: { numero: true },
            });
            const numero = existing?.numero as string | undefined;
            if (numero && !numero.includes('_DELETED_')) {
              data.numero = `${numero}_DELETED_${Date.now()}`;
            }
          }

          return dynamicClient[model].update({
            where: { id },
            data,
          });
        },
        async restore(id: string) {
          const model = (this as unknown as { name: string }).name;
          return dynamicClient[model].update({
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
