import { Inject, Injectable } from '@nestjs/common';
import {
  SortDirection,
  TASK_REPOSITORY,
  TaskSortField,
} from '../domain/task.repository';
import type {
  ListTasksOptions,
  TaskListResult,
  TaskRepository,
} from '../domain/task.repository';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

@Injectable()
export class ListTasksUseCase {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepository: TaskRepository,
  ) {}

  async execute(options: ListTasksOptions = {}): Promise<TaskListResult> {
    const skip = Math.max(0, options.pagination?.skip ?? 0);
    const take = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, options.pagination?.take ?? DEFAULT_PAGE_SIZE),
    );

    return this.taskRepository.findMany({
      filter: options.filter,
      pagination: { skip, take },
      sort: options.sort ?? {
        field: TaskSortField.CREATED_AT,
        direction: SortDirection.DESC,
      },
    });
  }
}
