import { Module } from '@nestjs/common';
import { CreateTagUseCase } from './application/create-tag.use-case';
import { DeleteTagUseCase } from './application/delete-tag.use-case';
import { GetTagUseCase } from './application/get-tag.use-case';
import { ListTagsUseCase } from './application/list-tags.use-case';
import { UpdateTagUseCase } from './application/update-tag.use-case';
import { TAG_REPOSITORY } from './domain/tag.repository';
import { TagPrismaRepository } from './infrastructure/tag.prisma-repository';

@Module({
  providers: [
    { provide: TAG_REPOSITORY, useClass: TagPrismaRepository },
    CreateTagUseCase,
    UpdateTagUseCase,
    DeleteTagUseCase,
    GetTagUseCase,
    ListTagsUseCase,
  ],
  exports: [TAG_REPOSITORY],
})
export class TagsModule {}
