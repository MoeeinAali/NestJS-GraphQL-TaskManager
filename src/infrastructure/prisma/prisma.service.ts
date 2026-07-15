import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';

const QUERY_LOGGING_ENABLED =
  process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';

function buildLogConfig(): Prisma.LogDefinition[] {
  return [
    ...(QUERY_LOGGING_ENABLED
      ? [{ emit: 'event', level: 'query' } as const]
      : []),
    { emit: 'event', level: 'warn' } as const,
    { emit: 'event', level: 'error' } as const,
  ];
}

/**
 * Thin wrapper around PrismaClient that ties its lifecycle to the Nest
 * application lifecycle and forwards Prisma's log events to the app logger
 * (SQL queries with timings in development; warnings/errors everywhere).
 * This is the single place the application touches the database driver.
 */
@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'warn' | 'error'>
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly logger: PinoLogger) {
    super({ log: buildLogConfig() });
    this.logger.setContext('Prisma');

    if (QUERY_LOGGING_ENABLED) {
      this.$on('query', (event) => {
        this.logger.debug(
          { durationMs: event.duration, params: event.params },
          event.query,
        );
      });
    }
    this.$on('warn', (event) => this.logger.warn(event.message));
    this.$on('error', (event) => this.logger.error(event.message));
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
