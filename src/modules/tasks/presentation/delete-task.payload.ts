import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DeleteTaskPayload {
  @Field(() => ID, { description: 'Id of the deleted task.' })
  id!: string;
}
