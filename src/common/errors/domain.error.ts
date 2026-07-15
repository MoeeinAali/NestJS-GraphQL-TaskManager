/**
 * Machine-readable error codes exposed to API clients through
 * `GraphQLError.extensions.code`.
 */
export const ErrorCode = {
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Base class for all domain errors. The domain layer throws these instead of
 * framework exceptions; the presentation layer translates them into GraphQL
 * errors. This keeps business rules independent from transport concerns.
 */
export abstract class DomainError extends Error {
  abstract readonly code: ErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
