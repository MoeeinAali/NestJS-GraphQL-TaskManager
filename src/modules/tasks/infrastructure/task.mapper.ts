import type { Prisma } from '@prisma/client';
import { TagMapper } from '../../tags/infrastructure/tag.mapper';
import { Priority } from '../domain/task-priority.enum';
import { TaskStatus } from '../domain/task-status.enum';
import { Task } from '../domain/task.entity';

export type TaskWithTags = Prisma.TaskGetPayload<{ include: { tags: true } }>;

/**
 * SQLite (via Prisma) has no enum columns, so priority is stored as an Int —
 * which also makes ORDER BY priority semantically correct — and status as a
 * String. These maps are the single source of truth for that translation.
 */
export const PRIORITY_TO_INT: Record<Priority, number> = {
  [Priority.LOW]: 1,
  [Priority.MEDIUM]: 2,
  [Priority.HIGH]: 3,
};

const INT_TO_PRIORITY = new Map<number, Priority>(
  Object.entries(PRIORITY_TO_INT).map(([priority, value]) => [
    value,
    priority as Priority,
  ]),
);

const VALID_STATUSES = new Set<string>(Object.values(TaskStatus));

export class TaskMapper {
  static toDomain(row: TaskWithTags): Task {
    return Task.reconstitute({
      id: row.id,
      title: row.title,
      description: row.description,
      status: TaskMapper.statusToDomain(row.status),
      priority: TaskMapper.priorityToDomain(row.priority),
      dueDate: row.dueDate,
      tags: row.tags.map((tag) => TagMapper.toDomain(tag)),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(task: Task): {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: number;
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: PRIORITY_TO_INT[task.priority],
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  private static statusToDomain(value: string): TaskStatus {
    if (!VALID_STATUSES.has(value)) {
      throw new Error(`Corrupt task row: unknown status "${value}"`);
    }
    return value as TaskStatus;
  }

  private static priorityToDomain(value: number): Priority {
    const priority = INT_TO_PRIORITY.get(value);
    if (!priority) {
      throw new Error(`Corrupt task row: unknown priority "${value}"`);
    }
    return priority;
  }
}
