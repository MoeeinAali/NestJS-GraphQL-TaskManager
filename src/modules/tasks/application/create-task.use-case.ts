import { Inject, Injectable } from '@nestjs/common';
import { TAG_REPOSITORY } from '../../tags/domain/tag.repository';
import type { TagRepository } from '../../tags/domain/tag.repository';
import { Task } from '../domain/task.entity';
import { TASK_REPOSITORY } from '../domain/task.repository';
import type { TaskRepository } from '../domain/task.repository';
import { CreateTaskCommand } from './commands';
import { resolveTags } from './resolve-tags';

@Injectable()
export class CreateTaskUseCase {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepository: TaskRepository,
    @Inject(TAG_REPOSITORY) private readonly tagRepository: TagRepository,
  ) {}

  async execute(command: CreateTaskCommand): Promise<Task> {
    const tags = await resolveTags(this.tagRepository, command.tagIds ?? []);

    const task = Task.create({
      title: command.title,
      description: command.description,
      priority: command.priority,
      dueDate: command.dueDate,
      tags,
    });

    return this.taskRepository.create(task);
  }
}
