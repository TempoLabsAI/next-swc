import { AiCostControlService } from '../src/ai/cost-control.service';

const mockPrisma: any = {
  organization_ai_budgets: {
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  },
  ai_usage_logs: {
    create: jest.fn(),
  },
};

describe('AiCostControlService', () => {
  let service: AiCostControlService;

  beforeEach(() => {
    service = new AiCostControlService(mockPrisma as any);
  });

  it('allows when no budget record exists', async () => {
    mockPrisma.organization_ai_budgets.findUnique.mockResolvedValue(null);
    await expect(service.checkBudgetAndReserve('org1', 100)).resolves.toBe(true);
  });
});
