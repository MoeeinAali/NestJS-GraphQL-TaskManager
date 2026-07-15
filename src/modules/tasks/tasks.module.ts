import { Module } from '@nestjs/common';
import { TagsModule } from '../tags/tags.module';
import { ChangeTaskStatusUseCase } from './application/change-task-status.use-case';
import { CreateTaskUseCase } from './application/create-task.use-case';
import { DeleteTaskUseCase } from './application/delete-task.use-case';
import { GetTaskUseCase } from './application/get-task.use-case';
import { GetTasksByTagIdsUseCase } from './application/get-tasks-by-tag-ids.use-case';
import { ListTasksUseCase } from './application/list-tasks.use-case';
import { UpdateTaskUseCase } from './application/update-task.use-case';
import { TASK_REPOSITORY } from './domain/task.repository';
import { TaskPrismaRepository } from './infrastructure/task.prisma-repository';

@Module({
  imports: [TagsModule],
  providers: [
    { provide: TASK_REPOSITORY, useClass: TaskPrismaRepository },
    CreateTaskUseCase,
    UpdateTaskUseCase,
    DeleteTaskUseCase,
    ChangeTaskStatusUseCase,
    GetTaskUseCase,
    ListTasksUseCase,
    GetTasksByTagIdsUseCase,
  ],
  exports: [GetTasksByTagIdsUseCase],
})
export class TasksModule {}
