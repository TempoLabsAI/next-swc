import { AsyncLocalStorage } from 'async_hooks';

type TenantStore = { tenantId?: string };

const asyncLocalStorage = new AsyncLocalStorage<TenantStore>();

export class TenantContext {
    static run(tenantId: string, fn: (...args: any[]) => any) {
        return asyncLocalStorage.run({ tenantId }, fn);
    }

    static getTenantId(): string | undefined {
        const store = asyncLocalStorage.getStore();
        return store?.tenantId;
    }
}
