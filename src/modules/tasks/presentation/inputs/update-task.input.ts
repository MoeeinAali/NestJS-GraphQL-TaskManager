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

/**
 * Partial update. Omitted fields stay untouched; `description` and `dueDate`
 * accept an explicit null to clear the value. `tagIds` replaces the whole
 * tag set. Status is changed through the dedicated changeTaskStatus mutation.
 */
@InputType()
export class UpdateTaskInput {
  @Field(() => String, { nullable: true })
  @ValidateIf((input: UpdateTaskInput) => input.title !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Pass null to clear the description.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @Field(() => Priority, { nullable: true })
  @ValidateIf((input: UpdateTaskInput) => input.priority !== undefined)
  @IsEnum(Priority)
  priority?: Priority;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description: 'Pass null to clear the due date.',
  })
  @IsOptional()
  @IsDate()
  dueDate?: Date | null;

  @Field(() => [ID], {
    nullable: true,
    description: 'Replaces the full tag set; pass [] to remove all tags.',
  })
  @ValidateIf((input: UpdateTaskInput) => input.tagIds !== undefined)
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
