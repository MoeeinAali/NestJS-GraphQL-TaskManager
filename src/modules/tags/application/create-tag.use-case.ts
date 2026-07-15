import { Inject, Injectable } from '@nestjs/common';
import { Tag } from '../domain/tag.entity';
import { TagNameAlreadyExistsError } from '../domain/tag.errors';
import { TAG_REPOSITORY } from '../domain/tag.repository';
import type { TagRepository } from '../domain/tag.repository';

export interface CreateTagCommand {
  name: string;
  color?: string | null;
}

@Injectable()
export class CreateTagUseCase {
  constructor(
    @Inject(TAG_REPOSITORY) private readonly tagRepository: TagRepository,
  ) {}

  async execute(command: CreateTagCommand): Promise<Tag> {
    // Create first so the domain entity normalizes (trims) the name,
    // then check uniqueness against the normalized value.
    const tag = Tag.create({ name: command.name, color: command.color });

    const existing = await this.tagRepository.findByName(tag.name);
    if (existing) {
      throw new TagNameAlreadyExistsError(tag.name);
    }

    return this.tagRepository.create(tag);
  }
}
