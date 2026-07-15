import { Tag } from '../../tags/domain/tag.entity';
import { TagNotFoundError } from '../../tags/domain/tag.errors';
import { InMemoryTagRepository } from '../../tags/application/testing/in-memory-tag.repository';
import { Priority } from '../domain/task-priority.enum';
import { Task } from '../domain/task.entity';
import { TaskNotFoundError } from '../domain/task.errors';
import { InMemoryTaskRepository } from './testing/in-memory-task.repository';
import { UpdateTaskUseCase } from './update-task.use-case';

describe('UpdateTaskUseCase', () => {
  let taskRepository: InMemoryTaskRepository;
  let tagRepository: InMemoryTagRepository;
  let useCase: UpdateTaskUseCase;

  beforeEach(() => {
    taskRepository = new InMemoryTaskRepository();
    tagRepository = new InMemoryTagRepository();
    useCase = new UpdateTaskUseCase(taskRepository, tagRepository);
  });

  it('throws when the task does not exist', async () => {
    await expect(useCase.execute('nope', { title: 'x' })).rejects.toThrow(
      TaskNotFoundError,
    );
  });

  it('applies partial changes only', async () => {
    const task = await taskRepository.create(
      Task.create({ title: 'Original', description: 'keep' }),
    );

    const updated = await useCase.execute(task.id, { priority: Priority.LOW });

    expect(updated.title).toBe('Original');
    expect(updated.description).toBe('keep');
    expect(updated.priority).toBe(Priority.LOW);
  });

  it('clears nullable fields when explicitly null', async () => {
    const task = await taskRepository.create(
      Task.create({ title: 'T', description: 'desc', dueDate: new Date() }),
    );

    const updated = await useCase.execute(task.id, {
      description: null,
      dueDate: null,
    });

    expect(updated.description).toBeNull();
    expect(updated.dueDate).toBeNull();
  });

  it('replaces the tag set from tagIds', async () => {
    const oldTag = await tagRepository.create(Tag.create({ name: 'old' }));
    const newTag = await tagRepository.create(Tag.create({ name: 'new' }));
    const task = await taskRepository.create(
      Task.create({ title: 'T', tags: [oldTag] }),
    );

    const updated = await useCase.execute(task.id, { tagIds: [newTag.id] });
    expect(updated.tags.map((t) => t.name)).toEqual(['new']);

    const cleared = await useCase.execute(task.id, { tagIds: [] });
    expect(cleared.tags).toEqual([]);
  });

  it('rejects unknown tag ids', async () => {
    const task = await taskRepository.create(Task.create({ title: 'T' }));

    await expect(
      useCase.execute(task.id, { tagIds: ['ghost'] }),
    ).rejects.toThrow(TagNotFoundError);
  });
});
