import { Priority } from './task-priority.enum';
import { TaskStatus } from './task-status.enum';
import { Task } from './task.entity';

/** Injection token for the TaskRepository port. */
export const TASK_REPOSITORY = Symbol('TASK_REPOSITORY');

export interface TaskFilter {
  status?: TaskStatus;
  priority?: Priority;
  /** Tasks that carry at least one of these tags. */
  tagIds?: string[];
  /** Case-insensitive substring match on title or description. */
  search?: string;
  dueBefore?: Date;
  dueAfter?: Date;
}

export enum TaskSortField {
  CREATED_AT = 'CREATED_AT',
  UPDATED_AT = 'UPDATED_AT',
  DUE_DATE = 'DUE_DATE',
  PRIORITY = 'PRIORITY',
  TITLE = 'TITLE',
}

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface TaskSort {
  field: TaskSortField;
  direction: SortDirection;
}

export interface Pagination {
  skip: number;
  take: number;
}

export interface ListTasksOptions {
  filter?: TaskFilter;
  pagination?: Partial<Pagination>;
  sort?: TaskSort;
}

export interface TaskListResult {
  items: Task[];
  totalCount: number;
}

/**
 * Persistence port for tasks. The domain and application layers know only
 * this interface; swapping SQLite for another database means providing a new
 * adapter in infrastructure — nothing else changes.
 */
export interface TaskRepository {
  findById(id: string): Promise<Task | null>;
  findMany(options: ListTasksOptions): Promise<TaskListResult>;
  /**
   * Batch lookup used by the GraphQL DataLoader: returns the tasks carrying
   * each of the given tags, keyed by tag id.
   */
  findByTagIds(tagIds: string[]): Promise<Map<string, Task[]>>;
  create(task: Task): Promise<Task>;
  update(task: Task): Promise<Task>;
  delete(id: string): Promise<void>;
}
