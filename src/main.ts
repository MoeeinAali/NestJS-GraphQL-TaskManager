import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  // Buffer startup logs until the pino logger takes over, so even
  // bootstrap messages come out structured.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const logger = app.get(Logger);
  app.useLogger(logger);

  app.enableShutdownHooks();

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(
    `GraphQL API ready at http://localhost:${port}/graphql`,
    'Bootstrap',
  );
}

void bootstrap();
