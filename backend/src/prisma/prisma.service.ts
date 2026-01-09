import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { TenantContext } from "../common/tenant/tenant.context";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: "event", level: "query" },
        { emit: "event", level: "error" },
        { emit: "event", level: "info" },
        { emit: "event", level: "warn" },
      ],
      errorFormat: "pretty",
    });

    // Prisma middleware: automatically scope tenant-scoped queries using AsyncLocalStorage tenant context.
    // This middleware will:
    // - add `organization_id` to `where` for read/update/delete operations when a tenant is set
    // - set `organization_id` on create operations when missing
    this.$use(async (params: any, next: any) => {
      try {
        const tenantId = TenantContext.getTenantId();
        if (!tenantId) return next(params);

        // Only apply to common query actions
        const tenantAwareActions = [
          'findMany', 'findFirst', 'findFirstOrThrow', 'findUniqueOrThrow',
          'create', 'update', 'delete', 'updateMany', 'deleteMany', 'upsert'
        ];

        if (!tenantAwareActions.includes(params.action)) {
          return next(params);
        }

        // For reads (findMany / findFirst / findFirstOrThrow / findUniqueOrThrow)
        if (['findMany', 'findFirst', 'findFirstOrThrow', 'findUniqueOrThrow'].includes(params.action)) {
          params.args = params.args || {};
          const where = params.args.where;
          if (where) {
            params.args.where = { AND: [where, { organization_id: tenantId }] };
          } else {
            params.args.where = { organization_id: tenantId };
          }
        }

        // For create operations, set organization_id if not provided
        if (params.action === 'create') {
          params.args = params.args || {};
          params.args.data = params.args.data || {};
          if (!Object.prototype.hasOwnProperty.call(params.args.data, 'organization_id')) {
            params.args.data.organization_id = tenantId;
          }
        }

        // For updates/deletes and many operations, ensure where includes organization_id
        if (['update', 'delete', 'updateMany', 'deleteMany', 'upsert'].includes(params.action)) {
          params.args = params.args || {};
          const where = params.args.where;
          if (where) {
            params.args.where = { AND: [where, { organization_id: tenantId }] };
          } else {
            params.args.where = { organization_id: tenantId };
          }
        }

        return next(params);
      } catch (e) {
        // If middleware fails, do not block the request unexpectedly; surface error to next
        return next(params);
      }
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log("Database connected successfully");

      this.$on("query" as never, (e: any) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });

      this.$on("error" as never, (e: any) => {
        this.logger.error(`Error: ${e.message}`);
      });
    } catch (error) {
      this.logger.error("Failed to connect to database", error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log("Database disconnected");
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Cannot clean database in production");
    }

    const models = Reflect.ownKeys(this).filter(
      (key) => key[0] !== "_" && key !== "constructor",
    );

    return Promise.all(
      models.map((modelKey) => {
        const model = this[modelKey as keyof this];
        if (model && typeof model === "object" && "deleteMany" in model) {
          return (model as any).deleteMany();
        }
      }),
    );
  }
}
