import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { GetTasksByTagIdsUseCase } from '../application/get-tasks-by-tag-ids.use-case';
import { Task } from '../domain/task.entity';

/**
 * Per-request DataLoader that batches all `Tag.tasks` field resolutions in a
 * query into ONE repository round-trip — the standard fix for GraphQL's
 * N+1 problem. REQUEST scope gives every GraphQL request its own cache.
 */
@Injectable({ scope: Scope.REQUEST })
export class TagTasksLoader extends DataLoader<string, Task[]> {
  constructor(getTasksByTagIds: GetTasksByTagIdsUseCase) {
    super(async (tagIds: readonly string[]) => {
      const tasksByTagId = await getTasksByTagIds.execute([...tagIds]);
      return tagIds.map((tagId) => tasksByTagId.get(tagId) ?? []);
    });
  }
}
