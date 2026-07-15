import { randomUUID } from 'node:crypto';
import { Tag } from '../../tags/domain/tag.entity';
import { Priority } from './task-priority.enum';
import { TaskStatus } from './task-status.enum';
import { InvalidTaskTitleError } from './task.errors';

const TITLE_MAX_LENGTH = 200;

export interface TaskProps {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: Date | null;
  tags: Tag[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskProps {
  title: string;
  description?: string | null;
  priority?: Priority;
  dueDate?: Date | null;
  tags?: Tag[];
}

/**
 * Partial update. Semantics follow GraphQL nullability:
 *  - `undefined` → field is left untouched
 *  - `null`      → field is cleared (description, dueDate)
 *  - `tags`      → replaces the whole tag set
 */
export interface UpdateTaskProps {
  title?: string;
  description?: string | null;
  priority?: Priority;
  dueDate?: Date | null;
  tags?: Tag[];
}

/**
 * Task aggregate root. Owns every invariant about a task; the layers above
 * orchestrate, the layers below persist — neither decides business rules.
 */
export class Task {
  private constructor(private readonly props: TaskProps) {}

  static create(input: CreateTaskProps): Task {
    const now = new Date();
    return new Task({
      id: randomUUID(),
      title: Task.validateTitle(input.title),
      description: input.description ?? null,
      status: TaskStatus.TODO,
      priority: input.priority ?? Priority.MEDIUM,
      dueDate: input.dueDate ?? null,
      tags: [...(input.tags ?? [])],
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: TaskProps): Task {
    return new Task({ ...props, tags: [...props.tags] });
  }

  update(changes: UpdateTaskProps): void {
    if (changes.title !== undefined) {
      this.props.title = Task.validateTitle(changes.title);
    }
    if (changes.description !== undefined) {
      this.props.description = changes.description;
    }
    if (changes.priority !== undefined) {
      this.props.priority = changes.priority;
    }
    if (changes.dueDate !== undefined) {
      this.props.dueDate = changes.dueDate;
    }
    if (changes.tags !== undefined) {
      this.props.tags = [...changes.tags];
    }
    this.touch();
  }

  /** Transitions are unrestricted: any status may move to any other. */
  changeStatus(next: TaskStatus): void {
    this.props.status = next;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  private static validateTitle(title: string): string {
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      throw new InvalidTaskTitleError('title must not be empty');
    }
    if (trimmed.length > TITLE_MAX_LENGTH) {
      throw new InvalidTaskTitleError(
        `title must be at most ${TITLE_MAX_LENGTH} characters`,
      );
    }
    return trimmed;
  }

  get id(): string {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | null {
    return this.props.description;
  }

  get status(): TaskStatus {
    return this.props.status;
  }

  get priority(): Priority {
    return this.props.priority;
  }

  get dueDate(): Date | null {
    return this.props.dueDate;
  }

  get tags(): Tag[] {
    return [...this.props.tags];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
