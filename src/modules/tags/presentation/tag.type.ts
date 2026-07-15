import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';

/**
 * GraphQL representation of a Tag. The `tasks` relation field is attached by
 * TagTasksResolver (tasks module) so the tags module stays free of task
 * dependencies.
 */
@ObjectType('Tag')
export class TagType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field(() => String, {
    nullable: true,
    description: 'Hex color like #AABBCC, for UI rendering.',
  })
  color!: string | null;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;
}
