import { Inject, Injectable } from '@nestjs/common';
import { Task } from '../domain/task.entity';
import { TASK_REPOSITORY } from '../domain/task.repository';
import type { TaskRepository } from '../domain/task.repository';

/**
 * Batch query backing the `Tag.tasks` DataLoader. Guarantees an entry
 * (possibly an empty array) for every requested tag id so the loader can
 * align results with its keys.
 */
@Injectable()
export class GetTasksByTagIdsUseCase {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepository: TaskRepository,
  ) {}

  async execute(tagIds: string[]): Promise<Map<string, Task[]>> {
    const found = await this.taskRepository.findByTagIds(tagIds);

    const result = new Map<string, Task[]>();
    for (const tagId of tagIds) {
      result.set(tagId, found.get(tagId) ?? []);
    }
    return result;
  }
}
