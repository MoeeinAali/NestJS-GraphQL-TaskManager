import { Inject, Injectable } from '@nestjs/common';
import { TagNotFoundError } from '../domain/tag.errors';
import { TAG_REPOSITORY } from '../domain/tag.repository';
import type { TagRepository } from '../domain/tag.repository';

@Injectable()
export class DeleteTagUseCase {
  constructor(
    @Inject(TAG_REPOSITORY) private readonly tagRepository: TagRepository,
  ) {}

  async execute(id: string): Promise<{ id: string }> {
    const tag = await this.tagRepository.findById(id);
    if (!tag) {
      throw new TagNotFoundError(id);
    }

    await this.tagRepository.delete(id);

    return { id };
  }
}
