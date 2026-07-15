import { Priority } from '../domain/task-priority.enum';

export interface CreateTaskCommand {
  title: string;
  description?: string | null;
  priority?: Priority;
  dueDate?: Date | null;
  tagIds?: string[];
}

/**
 * Partial update command. `undefined` leaves a field untouched, `null`
 * clears it (description, dueDate). `tagIds` replaces the whole tag set.
 */
export interface UpdateTaskCommand {
  title?: string;
  description?: string | null;
  priority?: Priority;
  dueDate?: Date | null;
  tagIds?: string[];
}
