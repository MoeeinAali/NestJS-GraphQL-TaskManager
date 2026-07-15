import { Priority } from '../../domain/task-priority.enum';
import { Task } from '../../domain/task.entity';
import {
  ListTasksOptions,
  SortDirection,
  TaskListResult,
  TaskRepository,
  TaskSort,
  TaskSortField,
} from '../../domain/task.repository';

const PRIORITY_RANK: Record<Priority, number> = {
  [Priority.LOW]: 1,
  [Priority.MEDIUM]: 2,
  [Priority.HIGH]: 3,
};

/**
 * In-memory TaskRepository used by unit tests. Implements filtering, sorting
 * and pagination honestly so use-case tests exercise realistic behavior.
 */
export class InMemoryTaskRepository implements TaskRepository {
  private readonly tasks = new Map<string, Task>();

  findById(id: string): Promise<Task | null> {
    return Promise.resolve(this.tasks.get(id) ?? null);
  }

  findMany(options: ListTasksOptions): Promise<TaskListResult> {
    const { filter, pagination, sort } = options;
    let items = [...this.tasks.values()];

    if (filter?.status !== undefined) {
      items = items.filter((task) => task.status === filter.status);
    }
    if (filter?.priority !== undefined) {
      items = items.filter((task) => task.priority === filter.priority);
    }
    if (filter?.tagIds !== undefined && filter.tagIds.length > 0) {
      const wanted = new Set(filter.tagIds);
      items = items.filter((task) =>
        task.tags.some((tag) => wanted.has(tag.id)),
      );
    }
    if (filter?.search !== undefined) {
      const query = filter.search.toLowerCase();
      items = items.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          (task.description ?? '').toLowerCase().includes(query),
      );
    }
    if (filter?.dueBefore !== undefined) {
      items = items.filter(
        (task) => task.dueDate !== null && task.dueDate <= filter.dueBefore!,
      );
    }
    if (filter?.dueAfter !== undefined) {
      items = items.filter(
        (task) => task.dueDate !== null && task.dueDate >= filter.dueAfter!,
      );
    }

    const totalCount = items.length;

    if (sort) {
      items.sort((a, b) => this.compare(a, b, sort));
    }

    const skip = pagination?.skip ?? 0;
    const take = pagination?.take ?? totalCount;

    return Promise.resolve({
      items: items.slice(skip, skip + take),
      totalCount,
    });
  }

  findByTagIds(tagIds: string[]): Promise<Map<string, Task[]>> {
    const result = new Map<string, Task[]>();
    for (const tagId of tagIds) {
      const matching = [...this.tasks.values()].filter((task) =>
        task.tags.some((tag) => tag.id === tagId),
      );
      result.set(tagId, matching);
    }
    return Promise.resolve(result);
  }

  create(task: Task): Promise<Task> {
    this.tasks.set(task.id, task);
    return Promise.resolve(task);
  }

  update(task: Task): Promise<Task> {
    this.tasks.set(task.id, task);
    return Promise.resolve(task);
  }

  delete(id: string): Promise<void> {
    this.tasks.delete(id);
    return Promise.resolve();
  }

  private compare(a: Task, b: Task, sort: TaskSort): number {
    const direction = sort.direction === SortDirection.ASC ? 1 : -1;

    const value = (task: Task): number | string => {
      switch (sort.field) {
        case TaskSortField.CREATED_AT:
          return task.createdAt.getTime();
        case TaskSortField.UPDATED_AT:
          return task.updatedAt.getTime();
        case TaskSortField.DUE_DATE:
          return task.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
        case TaskSortField.PRIORITY:
          return PRIORITY_RANK[task.priority];
        case TaskSortField.TITLE:
          return task.title.toLowerCase();
      }
    };

    const left = value(a);
    const right = value(b);
    if (left < right) return -1 * direction;
    if (left > right) return 1 * direction;
    return 0;
  }
}
