import { Priority } from '../domain/task-priority.enum';
import { TaskStatus } from '../domain/task-status.enum';
import { Task, TaskProps } from '../domain/task.entity';
import { SortDirection, TaskSortField } from '../domain/task.repository';
import { InMemoryTaskRepository } from './testing/in-memory-task.repository';
import {
  DEFAULT_PAGE_SIZE,
  ListTasksUseCase,
  MAX_PAGE_SIZE,
} from './list-tasks.use-case';

function buildTask(overrides: Partial<TaskProps> & { title: string }): Task {
  const now = new Date('2026-07-01T00:00:00Z');
  return Task.reconstitute({
    id: crypto.randomUUID(),
    description: null,
    status: TaskStatus.TODO,
    priority: Priority.MEDIUM,
    dueDate: null,
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

describe('ListTasksUseCase', () => {
  let repository: InMemoryTaskRepository;
  let useCase: ListTasksUseCase;

  beforeEach(() => {
    repository = new InMemoryTaskRepository();
    useCase = new ListTasksUseCase(repository);
  });

  it('applies default pagination', async () => {
    for (let i = 0; i < DEFAULT_PAGE_SIZE + 5; i++) {
      await repository.create(buildTask({ title: `task-${i}` }));
    }

    const result = await useCase.execute();

    expect(result.items).toHaveLength(DEFAULT_PAGE_SIZE);
    expect(result.totalCount).toBe(DEFAULT_PAGE_SIZE + 5);
  });

  it('caps take at MAX_PAGE_SIZE and clamps negative skip', async () => {
    const findMany = jest.spyOn(repository, 'findMany');

    await useCase.execute({ pagination: { skip: -10, take: 500 } });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        pagination: { skip: 0, take: MAX_PAGE_SIZE },
      }),
    );
  });

  it('filters by status', async () => {
    await repository.create(buildTask({ title: 'todo' }));
    await repository.create(
      buildTask({ title: 'done', status: TaskStatus.DONE }),
    );

    const result = await useCase.execute({
      filter: { status: TaskStatus.DONE },
    });

    expect(result.items.map((t) => t.title)).toEqual(['done']);
    expect(result.totalCount).toBe(1);
  });

  it('sorts by CREATED_AT descending by default', async () => {
    await repository.create(
      buildTask({ title: 'older', createdAt: new Date('2026-01-01') }),
    );
    await repository.create(
      buildTask({ title: 'newer', createdAt: new Date('2026-06-01') }),
    );

    const result = await useCase.execute();

    expect(result.items.map((t) => t.title)).toEqual(['newer', 'older']);
  });

  it('sorts by semantic priority order when requested', async () => {
    await repository.create(
      buildTask({ title: 'mid', priority: Priority.MEDIUM }),
    );
    await repository.create(
      buildTask({ title: 'high', priority: Priority.HIGH }),
    );
    await repository.create(
      buildTask({ title: 'low', priority: Priority.LOW }),
    );

    const result = await useCase.execute({
      sort: { field: TaskSortField.PRIORITY, direction: SortDirection.DESC },
    });

    expect(result.items.map((t) => t.title)).toEqual(['high', 'mid', 'low']);
  });
});
