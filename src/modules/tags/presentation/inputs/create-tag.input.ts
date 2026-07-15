import { Field, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

@InputType()
export class CreateTagInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(HEX_COLOR_PATTERN, {
    message: 'color must be a hex color like #AABBCC',
  })
  color?: string | null;
}
