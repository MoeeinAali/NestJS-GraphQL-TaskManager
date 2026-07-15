import { ArgumentMetadata, Injectable, ValidationPipe } from '@nestjs/common';

/**
 * ValidationPipe that leaves omitted (undefined) GraphQL arguments alone.
 *
 * The stock pipe coerces undefined to {} before validating, which wrongly
 * rejects optional args whose input types contain required fields — e.g.
 * `tasks(filter: {...})` without `sort` would fail TaskSortInput.field's
 * IsEnum check. GraphQL itself already guarantees required fields are
 * present whenever the argument is supplied.
 */
@Injectable()
export class GqlValidationPipe extends ValidationPipe {
  async transform(
    value: unknown,
    metadata: ArgumentMetadata,
  ): Promise<unknown> {
    if (value === undefined) {
      return undefined;
    }
    return super.transform(value, metadata);
  }
}
