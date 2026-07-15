import { Catch } from '@nestjs/common';
import type { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { DomainError } from '../errors/domain.error';

/**
 * Translates typed domain errors into GraphQL errors with a machine-readable
 * `extensions.code` (NOT_FOUND, CONFLICT, VALIDATION_ERROR). Anything else
 * bubbles up and is masked by Apollo as INTERNAL_SERVER_ERROR.
 */
@Catch(DomainError)
export class DomainExceptionFilter implements GqlExceptionFilter {
  catch(exception: DomainError): GraphQLError {
    return new GraphQLError(exception.message, {
      extensions: { code: exception.code },
    });
  }
}
