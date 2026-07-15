import { Field, GraphQLISODateTime, ID, InputType } from '@nestjs/graphql';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Priority } from '../../domain/task-priority.enum';

@InputType()
export class CreateTaskInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @Field(() => Priority, {
    nullable: true,
    description: 'Defaults to MEDIUM.',
  })
  @ValidateIf((input: CreateTaskInput) => input.priority !== undefined)
  @IsEnum(Priority)
  priority?: Priority;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  @IsDate()
  dueDate?: Date | null;

  @Field(() => [ID], {
    nullable: true,
    description: 'Ids of existing tags to attach.',
  })
  @ValidateIf((input: CreateTaskInput) => input.tagIds !== undefined)
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
