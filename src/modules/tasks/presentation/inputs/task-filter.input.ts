import { Field, GraphQLISODateTime, ID, InputType } from '@nestjs/graphql';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Priority } from '../../domain/task-priority.enum';
import { TaskStatus } from '../../domain/task-status.enum';

@InputType({ description: 'All criteria are combined with AND.' })
export class TaskFilterInput {
  @Field(() => TaskStatus, { nullable: true })
  @ValidateIf((input: TaskFilterInput) => input.status !== undefined)
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @Field(() => Priority, { nullable: true })
  @ValidateIf((input: TaskFilterInput) => input.priority !== undefined)
  @IsEnum(Priority)
  priority?: Priority;

  @Field(() => [ID], {
    nullable: true,
    description: 'Tasks carrying at least one of these tags.',
  })
  @ValidateIf((input: TaskFilterInput) => input.tagIds !== undefined)
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];

  @Field(() => String, {
    nullable: true,
    description: 'Substring match on title or description.',
  })
  @ValidateIf((input: TaskFilterInput) => input.search !== undefined)
  @IsString()
  @MaxLength(200)
  search?: string;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description: 'Tasks due at or before this instant.',
  })
  @ValidateIf((input: TaskFilterInput) => input.dueBefore !== undefined)
  @IsDate()
  dueBefore?: Date;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description: 'Tasks due at or after this instant.',
  })
  @ValidateIf((input: TaskFilterInput) => input.dueAfter !== undefined)
  @IsDate()
  dueAfter?: Date;
}
