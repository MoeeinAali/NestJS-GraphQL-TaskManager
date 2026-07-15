import { Task } from '../domain/task.entity';
import { InMemoryTaskRepository } from './testing/in-memory-task.repository';
import { GetTaskUseCase } from './get-task.use-case';

describe('GetTaskUseCase', () => {
  let repository: InMemoryTaskRepository;
  let useCase: GetTaskUseCase;

  beforeEach(() => {
    repository = new InMemoryTaskRepository();
    useCase = new GetTaskUseCase(repository);
  });

  it('returns null for unknown ids', async () => {
    await expect(useCase.execute('nope')).resolves.toBeNull();
  });

  it('returns the task when it exists', async () => {
    const task = await repository.create(Task.create({ title: 'T' }));
    await expect(useCase.execute(task.id)).resolves.toBe(task);
  });
});
