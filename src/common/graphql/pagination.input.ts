import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

@InputType({ description: 'Offset-based pagination.' })
export class PaginationInput {
  @Field(() => Int, {
    nullable: true,
    description: 'How many items to skip. Defaults to 0.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;

  @Field(() => Int, {
    nullable: true,
    description: 'Page size. Defaults to 20, capped at 50.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  take?: number;
}
