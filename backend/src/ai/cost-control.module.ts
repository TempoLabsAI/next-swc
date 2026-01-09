import { Module } from '@nestjs/common';
import { AiCostControlService } from './cost-control.service';
import { AiCostControlMiddleware } from './cost-control.middleware';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [AiCostControlService, AiCostControlMiddleware],
    exports: [AiCostControlService, AiCostControlMiddleware],
})
export class AiCostControlModule { }
