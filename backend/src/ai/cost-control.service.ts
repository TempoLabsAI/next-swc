import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiCostControlService {
    private readonly logger = new Logger(AiCostControlService.name);
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Check whether an organization has available budget for a predicted cost.
     * If allowed, return true. If soft-limit exceeded, return false or throw depending on policy.
     */
    async checkBudgetAndReserve(organizationId: string, estimatedCostCents: number) {
        // Basic protective checks. This assumes `organization_ai_budgets` table exists.
        const budget = await this.prisma.organization_ai_budgets.findUnique({
            where: { organization_id: organizationId },
        });

        if (!budget) {
            // No budget record -> allow by default but log
            this.logger.warn(`No AI budget record for org=${organizationId}. Allowing request by default.`);
            return true;
        }

        const remaining = (budget.monthly_budget_cents || 0) - (budget.spent_cents || 0);
        if (remaining <= 0 && budget.hard_limit) {
            // Hard block
            throw new ForbiddenException('AI monthly hard limit reached for your organization');
        }

        if (estimatedCostCents > remaining && budget.soft_limit) {
            // Soft limit exceeded: depending on policy we can reject or queue - here we reject with explicit message
            throw new ForbiddenException('AI monthly soft limit exceeded. Please contact support or upgrade your plan.');
        }

        // Reserve logic note: in a production system we may insert a reservation row and later confirm or rollback.
        return true;
    }

    /**
     * Record usage after a successful AI call.
     */
    async recordUsage(organizationId: string, providerId: string, modelId: string, tokensUsed: number, costCents: number) {
        await this.prisma.ai_usage_logs.create({
            data: {
                organization_id: organizationId,
                provider_id: providerId,
                model_id: modelId,
                tokens_used: tokensUsed,
                cost: (costCents / 100).toString(), // stored as Decimal string depending on schema
            },
        });

        // We'll update the aggregated budget incrementally (or via a separate aggregator job)
        await this.prisma.organization_ai_budgets.updateMany({
            where: { organization_id: organizationId },
            data: { spent_cents: { increment: costCents } as any },
        });
    }
}
