import { Field, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { HEX_COLOR_PATTERN } from './create-tag.input';

@InputType()
export class UpdateTagInput {
  @Field(() => String, { nullable: true })
  @ValidateIf((input: UpdateTagInput) => input.name !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Pass null to clear the color.',
  })
  @IsOptional()
  @Matches(HEX_COLOR_PATTERN, {
    message: 'color must be a hex color like #AABBCC',
  })
  color?: string | null;
}
