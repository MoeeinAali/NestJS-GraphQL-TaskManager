import { DomainError, ErrorCode } from '../../../common/errors/domain.error';

export class TaskNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;

  constructor(id: string) {
    super(`Task with id "${id}" was not found`);
  }
}

export class InvalidTaskTitleError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;

  constructor(reason: string) {
    super(`Invalid task title: ${reason}`);
  }
}
