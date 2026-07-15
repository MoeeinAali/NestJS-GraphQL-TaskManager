import { DomainError, ErrorCode } from '../../../common/errors/domain.error';

export class TagNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;

  constructor(idOrIds: string | string[]) {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    super(
      ids.length === 1
        ? `Tag with id "${ids[0]}" was not found`
        : `Tags with ids ${ids.map((id) => `"${id}"`).join(', ')} were not found`,
    );
  }
}

export class TagNameAlreadyExistsError extends DomainError {
  readonly code = ErrorCode.CONFLICT;

  constructor(name: string) {
    super(`A tag named "${name}" already exists`);
  }
}

export class InvalidTagNameError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;

  constructor(reason: string) {
    super(`Invalid tag name: ${reason}`);
  }
}
