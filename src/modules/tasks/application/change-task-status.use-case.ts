import { Inject, Injectable } from '@nestjs/common';
import { TaskStatus } from '../domain/task-status.enum';
import { Task } from '../domain/task.entity';
import { TaskNotFoundError } from '../domain/task.errors';
import { TASK_REPOSITORY } from '../domain/task.repository';
import type { TaskRepository } from '../domain/task.repository';

@Injectable()
export class ChangeTaskStatusUseCase {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepository: TaskRepository,
  ) {}

  async execute(id: string, status: TaskStatus): Promise<Task> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new TaskNotFoundError(id);
    }

    task.changeStatus(status);

    return this.taskRepository.update(task);
  }
}
