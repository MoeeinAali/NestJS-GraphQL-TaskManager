import { Field, Int, ObjectType } from '@nestjs/graphql';
import { TaskType } from './task.type';

@ObjectType({ description: 'One page of tasks plus pagination metadata.' })
export class TaskPage {
  @Field(() => [TaskType])
  items!: TaskType[];

  @Field(() => Int, {
    description: 'Total number of tasks matching the filter.',
  })
  totalCount!: number;

  @Field()
  hasNextPage!: boolean;
}
