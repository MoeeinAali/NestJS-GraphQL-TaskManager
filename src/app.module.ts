import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { BadRequestException, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import depthLimit from 'graphql-depth-limit';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { Environment, validateEnv } from './common/config/env.validation';
import { DomainExceptionFilter } from './common/filters/domain-exception.filter';
import { GraphQLLoggingPlugin } from './common/graphql/graphql-logging.plugin';
import { GqlValidationPipe } from './common/pipes/gql-validation.pipe';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { TagsModule } from './modules/tags/tags.module';
import { TasksModule } from './modules/tasks/tasks.module';

const DEFAULT_LOG_LEVELS: Record<Environment, string> = {
  [Environment.Development]: 'debug',
  [Environment.Production]: 'info',
  [Environment.Test]: 'silent',
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const env = config.get<Environment>(
          'NODE_ENV',
          Environment.Development,
        );
        return {
          pinoHttp: {
            level: config.get<string>('LOG_LEVEL') ?? DEFAULT_LOG_LEVELS[env],
            // Correlate every log line of a request via a generated id.
            genReqId: () => randomUUID(),
            // Structured JSON in production; readable one-liners in dev.
            transport:
              env === Environment.Development
                ? {
                    target: 'pino-pretty',
                    options: {
                      singleLine: true,
                      colorize: true,
                      translateTime: 'SYS:HH:MM:ss.l',
                    },
                  }
                : undefined,
            // The default serializers dump entire req/res objects; keep
            // request lines lean. The healthcheck poll is pure noise.
            serializers: {
              req: (req: { id: string; method: string; url: string }) => ({
                id: req.id,
                method: req.method,
                url: req.url,
              }),
            },
            autoLogging: {
              ignore: (req) => req.url === '/health',
            },
          },
        };
      },
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get<string>('NODE_ENV') === 'production';
        return {
          // Code-first: the schema is generated from TS decorators into this
          // file at startup (committed for easy browsing on GitHub).
          autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
          sortSchema: true,
          playground: false,
          plugins: [ApolloServerPluginLandingPageLocalDefault()],
          includeStacktraceInErrorResponses: !isProduction,
          // Guards against abusive deeply-nested queries (Task→Tag→Task→…).
          validationRules: [depthLimit(6)],
        };
      },
    }),
    PrismaModule,
    TasksModule,
    TagsModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new GqlValidationPipe({
        whitelist: true,
        transform: true,
        // Surface the concrete constraint messages instead of the generic
        // "Bad Request Exception" as the GraphQL error message.
        exceptionFactory: (errors) => {
          const messages = errors.flatMap((error) =>
            Object.values(error.constraints ?? {}),
          );
          return new BadRequestException(
            messages.length > 0 ? messages.join('; ') : 'Invalid input',
          );
        },
      }),
    },
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
    GraphQLLoggingPlugin,
  ],
})
export class AppModule {}
