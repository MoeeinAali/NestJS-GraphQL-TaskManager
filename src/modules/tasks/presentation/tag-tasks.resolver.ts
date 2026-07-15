import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { TagType } from '../../tags/presentation/tag.type';
import { TagTasksLoader } from './tag-tasks.loader';
import { TaskType } from './task.type';

/**
 * Attaches the `tasks` relation field to the Tag type. It lives in the tasks
 * module (not the tags module) because it resolves tasks — this also keeps
 * the module graph acyclic: tasks → tags, never the other way.
 */
@Resolver(() => TagType)
export class TagTasksResolver {
  constructor(private readonly tagTasksLoader: TagTasksLoader) {}

  @ResolveField('tasks', () => [TaskType], {
    description: 'Tasks carrying this tag.',
  })
  async tasks(@Parent() tag: TagType): Promise<TaskType[]> {
    return this.tagTasksLoader.load(tag.id);
  }
}
