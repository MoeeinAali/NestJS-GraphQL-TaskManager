import { randomUUID } from 'node:crypto';
import { InvalidTagNameError } from './tag.errors';

const NAME_MAX_LENGTH = 50;

export interface TagProps {
  id: string;
  name: string;
  color: string | null;
  createdAt: Date;
}

export interface CreateTagProps {
  name: string;
  color?: string | null;
}

export interface UpdateTagProps {
  name?: string;
  color?: string | null;
}

/**
 * Tag aggregate. Pure TypeScript — no framework or persistence concerns.
 * Uniqueness of `name` is a cross-aggregate rule enforced by the application
 * layer through the TagRepository port.
 */
export class Tag {
  private constructor(private readonly props: TagProps) {}

  static create(input: CreateTagProps): Tag {
    return new Tag({
      id: randomUUID(),
      name: Tag.validateName(input.name),
      color: input.color ?? null,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: TagProps): Tag {
    return new Tag({ ...props });
  }

  update(changes: UpdateTagProps): void {
    if (changes.name !== undefined) {
      this.props.name = Tag.validateName(changes.name);
    }
    if (changes.color !== undefined) {
      this.props.color = changes.color;
    }
  }

  private static validateName(name: string): string {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      throw new InvalidTagNameError('name must not be empty');
    }
    if (trimmed.length > NAME_MAX_LENGTH) {
      throw new InvalidTagNameError(
        `name must be at most ${NAME_MAX_LENGTH} characters`,
      );
    }
    return trimmed;
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get color(): string | null {
    return this.props.color;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
