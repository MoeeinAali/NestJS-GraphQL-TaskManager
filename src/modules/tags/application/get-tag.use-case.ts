import { Inject, Injectable } from '@nestjs/common';
import { Tag } from '../domain/tag.entity';
import { TAG_REPOSITORY } from '../domain/tag.repository';
import type { TagRepository } from '../domain/tag.repository';

@Injectable()
export class GetTagUseCase {
  constructor(
    @Inject(TAG_REPOSITORY) private readonly tagRepository: TagRepository,
  ) {}

  /** Returns null when the tag does not exist — idiomatic for GraphQL queries. */
  async execute(id: string): Promise<Tag | null> {
    return this.tagRepository.findById(id);
  }
}
