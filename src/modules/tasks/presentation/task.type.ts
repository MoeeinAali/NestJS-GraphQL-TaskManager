import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
import { TagType } from '../../tags/presentation/tag.type';
import { Priority } from '../domain/task-priority.enum';
import { TaskStatus } from '../domain/task-status.enum';
import './task.enums';

@ObjectType('Task', { description: 'A single unit of work to be done.' })
export class TaskType {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => TaskStatus)
  status!: TaskStatus;

  @Field(() => Priority)
  priority!: Priority;

  @Field(() => GraphQLISODateTime, { nullable: true })
  dueDate!: Date | null;

  @Field(() => [TagType], { description: 'Labels attached to this task.' })
  tags!: TagType[];

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}
