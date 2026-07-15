import { Tag } from '../../domain/tag.entity';
import { TagRepository } from '../../domain/tag.repository';

/** In-memory TagRepository used by unit tests. */
export class InMemoryTagRepository implements TagRepository {
  private readonly tags = new Map<string, Tag>();

  findById(id: string): Promise<Tag | null> {
    return Promise.resolve(this.tags.get(id) ?? null);
  }

  findByIds(ids: string[]): Promise<Tag[]> {
    return Promise.resolve(
      ids
        .map((id) => this.tags.get(id))
        .filter((tag): tag is Tag => tag !== undefined),
    );
  }

  findAll(): Promise<Tag[]> {
    return Promise.resolve([...this.tags.values()]);
  }

  findByName(name: string): Promise<Tag | null> {
    const match = [...this.tags.values()].find((tag) => tag.name === name);
    return Promise.resolve(match ?? null);
  }

  create(tag: Tag): Promise<Tag> {
    this.tags.set(tag.id, tag);
    return Promise.resolve(tag);
  }

  update(tag: Tag): Promise<Tag> {
    this.tags.set(tag.id, tag);
    return Promise.resolve(tag);
  }

  delete(id: string): Promise<void> {
    this.tags.delete(id);
    return Promise.resolve();
  }
}
