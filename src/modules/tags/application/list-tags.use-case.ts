import { Inject, Injectable } from '@nestjs/common';
import { Tag } from '../domain/tag.entity';
import { TAG_REPOSITORY } from '../domain/tag.repository';
import type { TagRepository } from '../domain/tag.repository';

@Injectable()
export class ListTagsUseCase {
  constructor(
    @Inject(TAG_REPOSITORY) private readonly tagRepository: TagRepository,
  ) {}

  async execute(): Promise<Tag[]> {
    return this.tagRepository.findAll();
  }
}
