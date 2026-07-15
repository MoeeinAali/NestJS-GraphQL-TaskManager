import type { Tag as PrismaTag } from '@prisma/client';
import { Tag } from '../domain/tag.entity';

/** Translates between Prisma rows and the Tag domain entity. */
export class TagMapper {
  static toDomain(row: PrismaTag): Tag {
    return Tag.reconstitute({
      id: row.id,
      name: row.name,
      color: row.color,
      createdAt: row.createdAt,
    });
  }

  static toPersistence(tag: Tag): {
    id: string;
    name: string;
    color: string | null;
    createdAt: Date;
  } {
    return {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      createdAt: tag.createdAt,
    };
  }
}
