import type {
  ApolloServerPlugin,
  BaseContext,
  GraphQLRequestContextDidEncounterErrors,
  GraphQLRequestContextWillSendResponse,
  GraphQLRequestListener,
} from '@apollo/server';
import { Plugin } from '@nestjs/apollo';
import { PinoLogger } from 'nestjs-pino';

/**
 * Logs every GraphQL operation with its name, kind and duration, and every
 * error with its machine-readable code. Client mistakes (NOT_FOUND, CONFLICT,
 * BAD_REQUEST, …) log as warnings; unexpected failures log as errors with
 * the stack attached.
 */
@Plugin()
export class GraphQLLoggingPlugin implements ApolloServerPlugin {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext('GraphQL');
  }

  requestDidStart(): Promise<GraphQLRequestListener<BaseContext>> {
    const startedAt = process.hrtime.bigint();
    const logger = this.logger;

    return Promise.resolve({
      willSendResponse(
        context: GraphQLRequestContextWillSendResponse<BaseContext>,
      ): Promise<void> {
        // Sandbox/IDE schema polling would drown out real traffic.
        if (context.operationName === 'IntrospectionQuery') {
          return Promise.resolve();
        }

        const durationMs =
          Number(process.hrtime.bigint() - startedAt) / 1_000_000;

        logger.info(
          {
            operation: context.operationName ?? 'anonymous',
            kind: context.operation?.operation ?? 'unknown',
            durationMs: Math.round(durationMs * 10) / 10,
          },
          'operation completed',
        );
        return Promise.resolve();
      },

      didEncounterErrors(
        context: GraphQLRequestContextDidEncounterErrors<BaseContext>,
      ): Promise<void> {
        for (const error of context.errors) {
          const code =
            (error.extensions?.code as string | undefined) ??
            'INTERNAL_SERVER_ERROR';
          const details = {
            operation: context.operationName ?? 'anonymous',
            code,
            path: error.path?.join('.'),
          };

          if (code === 'INTERNAL_SERVER_ERROR') {
            logger.error({ ...details, err: error }, error.message);
          } else {
            logger.warn(details, error.message);
          }
        }
        return Promise.resolve();
      },
    });
  }
}
