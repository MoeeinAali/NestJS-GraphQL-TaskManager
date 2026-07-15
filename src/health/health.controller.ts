import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

/**
 * Plain REST liveness/readiness probe (used by the Docker healthcheck).
 * Kept outside GraphQL on purpose: orchestrators speak plain HTTP.
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext('Health');
  }

  @Get()
  async check(): Promise<{ status: string; database: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'up' };
    } catch (error: unknown) {
      this.logger.error({ err: error }, 'database healthcheck failed');
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'down',
      });
    }
  }
}
