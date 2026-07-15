import { TaskStatus } from '../domain/task-status.enum';
import { Task } from '../domain/task.entity';
import { TaskNotFoundError } from '../domain/task.errors';
import { InMemoryTaskRepository } from './testing/in-memory-task.repository';
import { ChangeTaskStatusUseCase } from './change-task-status.use-case';

describe('ChangeTaskStatusUseCase', () => {
  let repository: InMemoryTaskRepository;
  let useCase: ChangeTaskStatusUseCase;

  beforeEach(() => {
    repository = new InMemoryTaskRepository();
    useCase = new ChangeTaskStatusUseCase(repository);
  });

  it('throws when the task does not exist', async () => {
    await expect(useCase.execute('nope', TaskStatus.DONE)).rejects.toThrow(
      TaskNotFoundError,
    );
  });

  it('changes status in any direction and persists it', async () => {
    const task = await repository.create(Task.create({ title: 'T' }));

    await useCase.execute(task.id, TaskStatus.DONE);
    await expect(repository.findById(task.id)).resolves.toHaveProperty(
      'status',
      TaskStatus.DONE,
    );

    // free transitions: DONE straight back to TODO is allowed
    const reverted = await useCase.execute(task.id, TaskStatus.TODO);
    expect(reverted.status).toBe(TaskStatus.TODO);
  });
});
