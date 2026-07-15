import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Task } from '../domain/task.entity';
import { TaskNotFoundError } from '../domain/task.errors';
import { SortDirection, TaskSortField } from '../domain/task.repository';
import type {
  ListTasksOptions,
  TaskFilter,
  TaskListResult,
  TaskRepository,
  TaskSort,
} from '../domain/task.repository';
import { PRIORITY_TO_INT, TaskMapper } from './task.mapper';

const SORT_FIELD_TO_COLUMN: Record<
  TaskSortField,
  keyof Prisma.TaskOrderByWithRelationInput
> = {
  [TaskSortField.CREATED_AT]: 'createdAt',
  [TaskSortField.UPDATED_AT]: 'updatedAt',
  [TaskSortField.DUE_DATE]: 'dueDate',
  [TaskSortField.PRIORITY]: 'priority',
  [TaskSortField.TITLE]: 'title',
};

/** SQLite adapter for the TaskRepository port. */
@Injectable()
export class TaskPrismaRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Task | null> {
    const row = await this.prisma.task.findUnique({
      where: { id },
      include: { tags: true },
    });
    return row ? TaskMapper.toDomain(row) : null;
  }

  async findMany(options: ListTasksOptions): Promise<TaskListResult> {
    const where = this.buildWhere(options.filter);

    const [rows, totalCount] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        orderBy: this.buildOrderBy(options.sort),
        skip: options.pagination?.skip,
        take: options.pagination?.take,
        include: { tags: true },
      }),
      this.prisma.task.count({ where }),
    ]);

    return { items: rows.map((row) => TaskMapper.toDomain(row)), totalCount };
  }

  async findByTagIds(tagIds: string[]): Promise<Map<string, Task[]>> {
    if (tagIds.length === 0) {
      return new Map();
    }

    const rows = await this.prisma.task.findMany({
      where: { tags: { some: { id: { in: tagIds } } } },
      orderBy: { createdAt: 'asc' },
      include: { tags: true },
    });

    const wanted = new Set(tagIds);
    const result = new Map<string, Task[]>();
    for (const row of rows) {
      const task = TaskMapper.toDomain(row);
      for (const tag of row.tags) {
        if (!wanted.has(tag.id)) {
          continue;
        }
        const bucket = result.get(tag.id) ?? [];
        bucket.push(task);
        result.set(tag.id, bucket);
      }
    }
    return result;
  }

  async create(task: Task): Promise<Task> {
    const row = await this.prisma.task.create({
      data: {
        ...TaskMapper.toPersistence(task),
        tags: { connect: task.tags.map((tag) => ({ id: tag.id })) },
      },
      include: { tags: true },
    });
    return TaskMapper.toDomain(row);
  }

  async update(task: Task): Promise<Task> {
    try {
      const persistence = TaskMapper.toPersistence(task);
      const row = await this.prisma.task.update({
        where: { id: task.id },
        data: {
          title: persistence.title,
          description: persistence.description,
          status: persistence.status,
          priority: persistence.priority,
          dueDate: persistence.dueDate,
          updatedAt: persistence.updatedAt,
          tags: { set: task.tags.map((tag) => ({ id: tag.id })) },
        },
        include: { tags: true },
      });
      return TaskMapper.toDomain(row);
    } catch (error) {
      throw this.translateMissingRecord(error, task.id);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.task.delete({ where: { id } });
    } catch (error) {
      throw this.translateMissingRecord(error, id);
    }
  }

  /** Maps Prisma's "record not found" (P2025) onto the domain error. */
  private translateMissingRecord(error: unknown, id: string): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return new TaskNotFoundError(id);
    }
    return error;
  }

  private buildWhere(filter?: TaskFilter): Prisma.TaskWhereInput {
    if (!filter) {
      return {};
    }

    const where: Prisma.TaskWhereInput = {};

    if (filter.status !== undefined) {
      where.status = filter.status;
    }
    if (filter.priority !== undefined) {
      where.priority = PRIORITY_TO_INT[filter.priority];
    }
    if (filter.tagIds !== undefined && filter.tagIds.length > 0) {
      where.tags = { some: { id: { in: filter.tagIds } } };
    }
    if (filter.search !== undefined && filter.search.trim().length > 0) {
      const query = filter.search.trim();
      where.OR = [
        { title: { contains: query } },
        { description: { contains: query } },
      ];
    }
    if (filter.dueBefore !== undefined || filter.dueAfter !== undefined) {
      where.dueDate = {
        ...(filter.dueBefore !== undefined ? { lte: filter.dueBefore } : {}),
        ...(filter.dueAfter !== undefined ? { gte: filter.dueAfter } : {}),
      };
    }

    return where;
  }

  private buildOrderBy(
    sort?: TaskSort,
  ): Prisma.TaskOrderByWithRelationInput | undefined {
    if (!sort) {
      return undefined;
    }
    return {
      [SORT_FIELD_TO_COLUMN[sort.field]]:
        sort.direction === SortDirection.ASC ? 'asc' : 'desc',
    };
  }
}
