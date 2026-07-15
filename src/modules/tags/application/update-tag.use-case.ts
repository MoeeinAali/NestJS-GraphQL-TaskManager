import { Inject, Injectable } from '@nestjs/common';
import { Tag } from '../domain/tag.entity';
import {
  TagNameAlreadyExistsError,
  TagNotFoundError,
} from '../domain/tag.errors';
import { TAG_REPOSITORY } from '../domain/tag.repository';
import type { TagRepository } from '../domain/tag.repository';

export interface UpdateTagCommand {
  name?: string;
  color?: string | null;
}

@Injectable()
export class UpdateTagUseCase {
  constructor(
    @Inject(TAG_REPOSITORY) private readonly tagRepository: TagRepository,
  ) {}

  async execute(id: string, command: UpdateTagCommand): Promise<Tag> {
    const tag = await this.tagRepository.findById(id);
    if (!tag) {
      throw new TagNotFoundError(id);
    }

    tag.update(command);

    if (command.name !== undefined) {
      const existing = await this.tagRepository.findByName(tag.name);
      if (existing && existing.id !== id) {
        throw new TagNameAlreadyExistsError(tag.name);
      }
    }

    return this.tagRepository.update(tag);
  }
}
