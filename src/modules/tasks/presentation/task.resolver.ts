import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PaginationInput } from '../../../common/graphql/pagination.input';
import { ChangeTaskStatusUseCase } from '../application/change-task-status.use-case';
import { CreateTaskUseCase } from '../application/create-task.use-case';
import { DeleteTaskUseCase } from '../application/delete-task.use-case';
import { GetTaskUseCase } from '../application/get-task.use-case';
import { ListTasksUseCase } from '../application/list-tasks.use-case';
import { UpdateTaskUseCase } from '../application/update-task.use-case';
import { TaskStatus } from '../domain/task-status.enum';
import { CreateTaskInput } from './inputs/create-task.input';
import { TaskFilterInput } from './inputs/task-filter.input';
import { TaskSortInput } from './inputs/task-sort.input';
import { UpdateTaskInput } from './inputs/update-task.input';
import { DeleteTaskPayload } from './delete-task.payload';
import { TaskPage } from './task-page.type';
import { TaskType } from './task.type';

@Resolver(() => TaskType)
export class TaskResolver {
  constructor(
    private readonly createTaskUseCase: CreateTaskUseCase,
    private readonly updateTaskUseCase: UpdateTaskUseCase,
    private readonly deleteTaskUseCase: DeleteTaskUseCase,
    private readonly changeTaskStatusUseCase: ChangeTaskStatusUseCase,
    private readonly getTaskUseCase: GetTaskUseCase,
    private readonly listTasksUseCase: ListTasksUseCase,
  ) {}

  @Query(() => TaskPage, {
    name: 'tasks',
    description: 'List tasks with optional filtering, sorting and pagination.',
  })
  async tasks(
    @Args('filter', { nullable: true }) filter?: TaskFilterInput,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    @Args('sort', { nullable: true }) sort?: TaskSortInput,
  ): Promise<TaskPage> {
    const result = await this.listTasksUseCase.execute({
      filter,
      pagination,
      sort,
    });

    return {
      items: result.items,
      totalCount: result.totalCount,
      hasNextPage: result.skip + result.items.length < result.totalCount,
    };
  }

  @Query(() => TaskType, {
    name: 'task',
    nullable: true,
    description: 'A single task by id, or null if it does not exist.',
  })
  async task(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<TaskType | null> {
    return this.getTaskUseCase.execute(id);
  }

  @Mutation(() => TaskType)
  async createTask(@Args('input') input: CreateTaskInput): Promise<TaskType> {
    return this.createTaskUseCase.execute(input);
  }

  @Mutation(() => TaskType)
  async updateTask(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateTaskInput,
  ): Promise<TaskType> {
    return this.updateTaskUseCase.execute(id, input);
  }

  @Mutation(() => TaskType, {
    description: 'Move a task between TODO, DOING and DONE (any direction).',
  })
  async changeTaskStatus(
    @Args('id', { type: () => ID }) id: string,
    @Args('status', { type: () => TaskStatus }) status: TaskStatus,
  ): Promise<TaskType> {
    return this.changeTaskStatusUseCase.execute(id, status);
  }

  @Mutation(() => DeleteTaskPayload)
  async deleteTask(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<DeleteTaskPayload> {
    return this.deleteTaskUseCase.execute(id);
  }
}
