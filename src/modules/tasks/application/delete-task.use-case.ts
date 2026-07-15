import { Inject, Injectable } from '@nestjs/common';
import { TaskNotFoundError } from '../domain/task.errors';
import { TASK_REPOSITORY } from '../domain/task.repository';
import type { TaskRepository } from '../domain/task.repository';

@Injectable()
export class DeleteTaskUseCase {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepository: TaskRepository,
  ) {}

  async execute(id: string): Promise<{ id: string }> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new TaskNotFoundError(id);
    }

    await this.taskRepository.delete(id);

    return { id };
  }
}
