import { Tag } from './tag.entity';

/** Injection token for the TagRepository port. */
export const TAG_REPOSITORY = Symbol('TAG_REPOSITORY');

export interface TagRepository {
  findById(id: string): Promise<Tag | null>;
  findByIds(ids: string[]): Promise<Tag[]>;
  findAll(): Promise<Tag[]>;
  findByName(name: string): Promise<Tag | null>;
  create(tag: Tag): Promise<Tag>;
  update(tag: Tag): Promise<Tag>;
  delete(id: string): Promise<void>;
}
