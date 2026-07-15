import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DeleteTagPayload {
  @Field(() => ID, { description: 'Id of the deleted tag.' })
  id!: string;
}
