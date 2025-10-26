import { TenantContext } from '../src/common/tenant/tenant.context';

describe('TenantContext', () => {
  it('sets and gets tenant id within run', () => {
    const id = '11111111-1111-1111-1111-111111111111';
    TenantContext.run(id, () => {
      expect(TenantContext.getTenantId()).toBe(id);
    });
    // outside run, tenant should be undefined
    expect(TenantContext.getTenantId()).toBeUndefined();
  });
});
