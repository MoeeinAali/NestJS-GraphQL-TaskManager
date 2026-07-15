import { Field, InputType } from '@nestjs/graphql';
import { IsEnum } from 'class-validator';
import { SortDirection, TaskSortField } from '../../domain/task.repository';
import '../task.enums';

@InputType()
export class TaskSortInput {
  @Field(() => TaskSortField)
  @IsEnum(TaskSortField)
  field!: TaskSortField;

  @Field(() => SortDirection, {
    nullable: true,
    defaultValue: SortDirection.DESC,
  })
  @IsEnum(SortDirection)
  direction!: SortDirection;
}
