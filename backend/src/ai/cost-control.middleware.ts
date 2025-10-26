import { Injectable, NestMiddleware, UnauthorizedException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AiCostControlService } from './cost-control.service';

@Injectable()
export class AiCostControlMiddleware implements NestMiddleware {
    private readonly logger = new Logger(AiCostControlMiddleware.name);
    constructor(private readonly costControl: AiCostControlService) { }

    async use(req: Request, _res: Response, next: NextFunction) {
        try {
            // Determine organization id from the authenticated user or header. Adjust to your auth model.
            const orgId = (req as any).user?.organizationId || req.headers['x-organization-id'];
            if (!orgId) {
                // If no org context, fail-safe: allow but log.
                this.logger.warn('AI request without organization context');
                return next();
            }

            // Estimate cost: This is a simple heuristic. Production should compute better.
            const estimatedTokens = this.estimateTokens(req);
            const estimatedCostCents = this.estimateCostCentsFromTokens(estimatedTokens);

            await this.costControl.checkBudgetAndReserve(orgId as string, estimatedCostCents);
            return next();
        } catch (err) {
            this.logger.warn('AI request blocked by cost-control: ' + (err as any)?.message);
            throw err;
        }
    }

    private estimateTokens(req: Request) {
        // Heuristic: for text generation, token estimate roughly equals char_count / 4
        try {
            const body = req.body;
            if (!body) return 100;
            const prompt = body.prompt || JSON.stringify(body);
            const chars = String(prompt).length;
            return Math.max(10, Math.floor(chars / 4));
        } catch (e) {
            return 100;
        }
    }

    private estimateCostCentsFromTokens(tokens: number) {
        // Placeholder: 0.01 cent per token -> 1 token = 0.0001 USD
        const costPerTokenCents = 0.01;
        return Math.ceil(tokens * costPerTokenCents);
    }
}
