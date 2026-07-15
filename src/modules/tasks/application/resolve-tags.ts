import { Tag } from '../../tags/domain/tag.entity';
import { TagNotFoundError } from '../../tags/domain/tag.errors';
import { TagRepository } from '../../tags/domain/tag.repository';

/**
 * Resolves tag ids to Tag entities, failing loudly with the full list of
 * missing ids so the client can fix its input in one round-trip.
 */
export async function resolveTags(
  tagRepository: TagRepository,
  tagIds: string[],
): Promise<Tag[]> {
  const uniqueIds = [...new Set(tagIds)];
  if (uniqueIds.length === 0) {
    return [];
  }

  const tags = await tagRepository.findByIds(uniqueIds);
  if (tags.length !== uniqueIds.length) {
    const foundIds = new Set(tags.map((tag) => tag.id));
    throw new TagNotFoundError(uniqueIds.filter((id) => !foundIds.has(id)));
  }
  return tags;
}
