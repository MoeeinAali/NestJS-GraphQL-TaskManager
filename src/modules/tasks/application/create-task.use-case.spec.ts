import { Tag } from '../../tags/domain/tag.entity';
import { TagNotFoundError } from '../../tags/domain/tag.errors';
import { InMemoryTagRepository } from '../../tags/application/testing/in-memory-tag.repository';
import { Priority } from '../domain/task-priority.enum';
import { TaskStatus } from '../domain/task-status.enum';
import { InMemoryTaskRepository } from './testing/in-memory-task.repository';
import { CreateTaskUseCase } from './create-task.use-case';

describe('CreateTaskUseCase', () => {
  let taskRepository: InMemoryTaskRepository;
  let tagRepository: InMemoryTagRepository;
  let useCase: CreateTaskUseCase;

  beforeEach(() => {
    taskRepository = new InMemoryTaskRepository();
    tagRepository = new InMemoryTagRepository();
    useCase = new CreateTaskUseCase(taskRepository, tagRepository);
  });

  it('creates and persists a task with defaults', async () => {
    const task = await useCase.execute({ title: 'Buy groceries' });

    expect(task.status).toBe(TaskStatus.TODO);
    expect(task.priority).toBe(Priority.MEDIUM);
    await expect(taskRepository.findById(task.id)).resolves.toBe(task);
  });

  it('resolves tag ids into tag entities', async () => {
    const tag = await tagRepository.create(Tag.create({ name: 'errands' }));

    const task = await useCase.execute({
      title: 'Buy groceries',
      priority: Priority.HIGH,
      tagIds: [tag.id],
    });

    expect(task.tags.map((t) => t.id)).toEqual([tag.id]);
  });

  it('rejects unknown tag ids, listing all missing ones', async () => {
    const tag = await tagRepository.create(Tag.create({ name: 'known' }));

    await expect(
      useCase.execute({
        title: 'T',
        tagIds: [tag.id, 'missing-1', 'missing-2'],
      }),
    ).rejects.toThrow(TagNotFoundError);
    await expect(
      useCase.execute({ title: 'T', tagIds: ['missing-1', 'missing-2'] }),
    ).rejects.toThrow(/missing-1.*missing-2/);
  });
});
