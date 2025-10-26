import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContext } from './tenant.context';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const tenantId = req?.user?.organizationId || req?.headers?.['x-organization-id'];

        if (!tenantId) {
            return next.handle();
        }

        // Run the request handling within the AsyncLocalStorage context so Prisma middleware can read tenantId
        return TenantContext.run(String(tenantId), () => next.handle()) as unknown as Observable<any>;
    }
}
