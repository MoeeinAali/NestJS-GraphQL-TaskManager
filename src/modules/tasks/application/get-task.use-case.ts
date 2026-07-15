import { Inject, Injectable } from '@nestjs/common';
import { Task } from '../domain/task.entity';
import { TASK_REPOSITORY } from '../domain/task.repository';
import type { TaskRepository } from '../domain/task.repository';

@Injectable()
export class GetTaskUseCase {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepository: TaskRepository,
  ) {}

  /** Returns null when the task does not exist — idiomatic for GraphQL queries. */
  async execute(id: string): Promise<Task | null> {
    return this.taskRepository.findById(id);
  }
}
