import { registerEnumType } from '@nestjs/graphql';
import { Priority } from '../domain/task-priority.enum';
import { TaskStatus } from '../domain/task-status.enum';
import { SortDirection, TaskSortField } from '../domain/task.repository';

/**
 * Exposes the domain enums to the GraphQL schema. Importing this module
 * (for its side effects) is enough to register them once.
 */
registerEnumType(TaskStatus, {
  name: 'TaskStatus',
  description: 'Lifecycle state of a task. Transitions are unrestricted.',
});

registerEnumType(Priority, {
  name: 'Priority',
  description: 'How urgent a task is.',
});

registerEnumType(TaskSortField, {
  name: 'TaskSortField',
  description: 'Field to sort tasks by.',
});

registerEnumType(SortDirection, {
  name: 'SortDirection',
});
