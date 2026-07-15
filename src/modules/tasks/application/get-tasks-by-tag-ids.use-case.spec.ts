import { Tag } from '../../tags/domain/tag.entity';
import { Task } from '../domain/task.entity';
import { InMemoryTaskRepository } from './testing/in-memory-task.repository';
import { GetTasksByTagIdsUseCase } from './get-tasks-by-tag-ids.use-case';

describe('GetTasksByTagIdsUseCase', () => {
  it('groups tasks by tag id and fills unknown ids with empty arrays', async () => {
    const repository = new InMemoryTaskRepository();
    const useCase = new GetTasksByTagIdsUseCase(repository);

    const work = Tag.create({ name: 'work' });
    const home = Tag.create({ name: 'home' });
    const taskA = await repository.create(
      Task.create({ title: 'A', tags: [work] }),
    );
    const taskB = await repository.create(
      Task.create({ title: 'B', tags: [work, home] }),
    );

    const result = await useCase.execute([work.id, home.id, 'unknown']);

    expect(result.get(work.id)?.map((t) => t.id)).toEqual([taskA.id, taskB.id]);
    expect(result.get(home.id)?.map((t) => t.id)).toEqual([taskB.id]);
    expect(result.get('unknown')).toEqual([]);
  });
});
