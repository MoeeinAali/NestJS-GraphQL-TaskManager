import { Inject, Injectable } from '@nestjs/common';
import { TAG_REPOSITORY } from '../../tags/domain/tag.repository';
import type { TagRepository } from '../../tags/domain/tag.repository';
import { UpdateTaskProps, Task } from '../domain/task.entity';
import { TaskNotFoundError } from '../domain/task.errors';
import { TASK_REPOSITORY } from '../domain/task.repository';
import type { TaskRepository } from '../domain/task.repository';
import { UpdateTaskCommand } from './commands';
import { resolveTags } from './resolve-tags';

@Injectable()
export class UpdateTaskUseCase {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepository: TaskRepository,
    @Inject(TAG_REPOSITORY) private readonly tagRepository: TagRepository,
  ) {}

  async execute(id: string, command: UpdateTaskCommand): Promise<Task> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new TaskNotFoundError(id);
    }

    const changes: UpdateTaskProps = {
      title: command.title,
      description: command.description,
      priority: command.priority,
      dueDate: command.dueDate,
    };
    if (command.tagIds !== undefined) {
      changes.tags = await resolveTags(this.tagRepository, command.tagIds);
    }

    task.update(changes);

    return this.taskRepository.update(task);
  }
}
