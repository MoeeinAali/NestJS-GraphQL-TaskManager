import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { BadRequestException, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import depthLimit from 'graphql-depth-limit';
import { join } from 'node:path';
import { validateEnv } from './common/config/env.validation';
import { DomainExceptionFilter } from './common/filters/domain-exception.filter';
import { GqlValidationPipe } from './common/pipes/gql-validation.pipe';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { TagsModule } from './modules/tags/tags.module';
import { TasksModule } from './modules/tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
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
  ],
})
export class AppModule {}
