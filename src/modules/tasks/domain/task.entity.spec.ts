import { Tag } from '../../tags/domain/tag.entity';
import { Priority } from './task-priority.enum';
import { TaskStatus } from './task-status.enum';
import { InvalidTaskTitleError } from './task.errors';
import { Task } from './task.entity';

describe('Task entity', () => {
  describe('create', () => {
    it('creates a task with sane defaults', () => {
      const task = Task.create({ title: 'Write report' });

      expect(task.id).toMatch(/^[0-9a-f-]{36}$/i);
      expect(task.title).toBe('Write report');
      expect(task.description).toBeNull();
      expect(task.status).toBe(TaskStatus.TODO);
      expect(task.priority).toBe(Priority.MEDIUM);
      expect(task.dueDate).toBeNull();
      expect(task.tags).toEqual([]);
      expect(task.createdAt).toBeInstanceOf(Date);
      expect(task.updatedAt.getTime()).toBe(task.createdAt.getTime());
    });

    it('accepts explicit fields', () => {
      const tag = Tag.create({ name: 'uni' });
      const due = new Date('2026-08-01T12:00:00Z');
      const task = Task.create({
        title: 'Submit HW4',
        description: 'GraphQL assignment',
        priority: Priority.HIGH,
        dueDate: due,
        tags: [tag],
      });

      expect(task.description).toBe('GraphQL assignment');
      expect(task.priority).toBe(Priority.HIGH);
      expect(task.dueDate).toEqual(due);
      expect(task.tags).toHaveLength(1);
      expect(task.tags[0].name).toBe('uni');
    });

    it('trims the title', () => {
      expect(Task.create({ title: '  padded  ' }).title).toBe('padded');
    });

    it.each(['', '   '])('rejects blank title %j', (title) => {
      expect(() => Task.create({ title })).toThrow(InvalidTaskTitleError);
    });

    it('rejects titles longer than 200 characters', () => {
      expect(() => Task.create({ title: 'x'.repeat(201) })).toThrow(
        InvalidTaskTitleError,
      );
    });
  });

  describe('update', () => {
    it('applies partial changes and leaves omitted fields untouched', () => {
      const task = Task.create({ title: 'Original', description: 'keep me' });

      task.update({ title: 'Renamed' });

      expect(task.title).toBe('Renamed');
      expect(task.description).toBe('keep me');
    });

    it('clears description and dueDate when explicitly set to null', () => {
      const task = Task.create({
        title: 'T',
        description: 'desc',
        dueDate: new Date(),
      });

      task.update({ description: null, dueDate: null });

      expect(task.description).toBeNull();
      expect(task.dueDate).toBeNull();
    });

    it('validates the new title', () => {
      const task = Task.create({ title: 'ok' });
      expect(() => task.update({ title: ' ' })).toThrow(InvalidTaskTitleError);
    });

    it('replaces the tag set', () => {
      const first = Tag.create({ name: 'a' });
      const second = Tag.create({ name: 'b' });
      const task = Task.create({ title: 'T', tags: [first] });

      task.update({ tags: [second] });

      expect(task.tags.map((tag) => tag.name)).toEqual(['b']);
    });

    it('touches updatedAt', () => {
      jest.useFakeTimers({ now: new Date('2026-07-15T10:00:00Z') });
      try {
        const task = Task.create({ title: 'T' });
        jest.setSystemTime(new Date('2026-07-15T11:00:00Z'));

        task.update({ title: 'T2' });

        expect(task.updatedAt).toEqual(new Date('2026-07-15T11:00:00Z'));
        expect(task.createdAt).toEqual(new Date('2026-07-15T10:00:00Z'));
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('changeStatus', () => {
    const statuses = Object.values(TaskStatus);
    const transitions = statuses.flatMap((from) =>
      statuses.map((to) => [from, to] as const),
    );

    it.each(transitions)('allows transition %s -> %s', (from, to) => {
      const task = Task.create({ title: 'T' });
      task.changeStatus(from);

      task.changeStatus(to);

      expect(task.status).toBe(to);
    });

    it('touches updatedAt', () => {
      jest.useFakeTimers({ now: new Date('2026-07-15T10:00:00Z') });
      try {
        const task = Task.create({ title: 'T' });
        jest.setSystemTime(new Date('2026-07-15T12:00:00Z'));

        task.changeStatus(TaskStatus.DONE);

        expect(task.updatedAt).toEqual(new Date('2026-07-15T12:00:00Z'));
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('reconstitute', () => {
    it('restores a task without re-running creation defaults', () => {
      const props = {
        id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        title: 'Restored',
        description: null,
        status: TaskStatus.DONE,
        priority: Priority.LOW,
        dueDate: null,
        tags: [],
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-02T00:00:00Z'),
      };

      const task = Task.reconstitute(props);

      expect(task.id).toBe(props.id);
      expect(task.status).toBe(TaskStatus.DONE);
      expect(task.priority).toBe(Priority.LOW);
      expect(task.createdAt).toEqual(props.createdAt);
      expect(task.updatedAt).toEqual(props.updatedAt);
    });
  });
});
