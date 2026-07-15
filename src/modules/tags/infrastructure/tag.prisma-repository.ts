import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Tag } from '../domain/tag.entity';
import {
  TagNameAlreadyExistsError,
  TagNotFoundError,
} from '../domain/tag.errors';
import type { TagRepository } from '../domain/tag.repository';
import { TagMapper } from './tag.mapper';

/** SQLite adapter for the TagRepository port. */
@Injectable()
export class TagPrismaRepository implements TagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Tag | null> {
    const row = await this.prisma.tag.findUnique({ where: { id } });
    return row ? TagMapper.toDomain(row) : null;
  }

  async findByIds(ids: string[]): Promise<Tag[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.prisma.tag.findMany({
      where: { id: { in: ids } },
    });
    return rows.map((row) => TagMapper.toDomain(row));
  }

  async findAll(): Promise<Tag[]> {
    const rows = await this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
    return rows.map((row) => TagMapper.toDomain(row));
  }

  async findByName(name: string): Promise<Tag | null> {
    const row = await this.prisma.tag.findUnique({ where: { name } });
    return row ? TagMapper.toDomain(row) : null;
  }

  async create(tag: Tag): Promise<Tag> {
    try {
      const row = await this.prisma.tag.create({
        data: TagMapper.toPersistence(tag),
      });
      return TagMapper.toDomain(row);
    } catch (error) {
      // The use case checks uniqueness first, but the DB constraint is the
      // final authority under concurrency (P2002 = unique violation).
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new TagNameAlreadyExistsError(tag.name);
      }
      throw error;
    }
  }

  async update(tag: Tag): Promise<Tag> {
    try {
      const persistence = TagMapper.toPersistence(tag);
      const row = await this.prisma.tag.update({
        where: { id: tag.id },
        data: { name: persistence.name, color: persistence.color },
      });
      return TagMapper.toDomain(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new TagNameAlreadyExistsError(tag.name);
        }
        if (error.code === 'P2025') {
          throw new TagNotFoundError(tag.id);
        }
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.tag.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new TagNotFoundError(id);
      }
      throw error;
    }
  }
}
