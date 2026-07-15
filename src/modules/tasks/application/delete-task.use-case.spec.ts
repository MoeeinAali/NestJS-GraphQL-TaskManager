import { Task } from '../domain/task.entity';
import { TaskNotFoundError } from '../domain/task.errors';
import { InMemoryTaskRepository } from './testing/in-memory-task.repository';
import { DeleteTaskUseCase } from './delete-task.use-case';

describe('DeleteTaskUseCase', () => {
  let repository: InMemoryTaskRepository;
  let useCase: DeleteTaskUseCase;

  beforeEach(() => {
    repository = new InMemoryTaskRepository();
    useCase = new DeleteTaskUseCase(repository);
  });

  it('throws when the task does not exist', async () => {
    await expect(useCase.execute('nope')).rejects.toThrow(TaskNotFoundError);
  });

  it('deletes the task and returns its id', async () => {
    const task = await repository.create(Task.create({ title: 'T' }));

    await expect(useCase.execute(task.id)).resolves.toEqual({ id: task.id });
    await expect(repository.findById(task.id)).resolves.toBeNull();
  });
});
