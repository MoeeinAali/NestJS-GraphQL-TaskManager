import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateTagUseCase } from '../application/create-tag.use-case';
import { DeleteTagUseCase } from '../application/delete-tag.use-case';
import { GetTagUseCase } from '../application/get-tag.use-case';
import { ListTagsUseCase } from '../application/list-tags.use-case';
import { UpdateTagUseCase } from '../application/update-tag.use-case';
import { CreateTagInput } from './inputs/create-tag.input';
import { UpdateTagInput } from './inputs/update-tag.input';
import { DeleteTagPayload } from './delete-tag.payload';
import { TagType } from './tag.type';

@Resolver(() => TagType)
export class TagResolver {
  constructor(
    private readonly createTagUseCase: CreateTagUseCase,
    private readonly updateTagUseCase: UpdateTagUseCase,
    private readonly deleteTagUseCase: DeleteTagUseCase,
    private readonly getTagUseCase: GetTagUseCase,
    private readonly listTagsUseCase: ListTagsUseCase,
  ) {}

  @Query(() => [TagType], {
    name: 'tags',
    description: 'All tags, sorted by name.',
  })
  async tags(): Promise<TagType[]> {
    return this.listTagsUseCase.execute();
  }

  @Query(() => TagType, {
    name: 'tag',
    nullable: true,
    description: 'A single tag by id, or null if it does not exist.',
  })
  async tag(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<TagType | null> {
    return this.getTagUseCase.execute(id);
  }

  @Mutation(() => TagType)
  async createTag(@Args('input') input: CreateTagInput): Promise<TagType> {
    return this.createTagUseCase.execute(input);
  }

  @Mutation(() => TagType)
  async updateTag(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateTagInput,
  ): Promise<TagType> {
    return this.updateTagUseCase.execute(id, input);
  }

  @Mutation(() => DeleteTagPayload, {
    description: 'Delete a tag. It is detached from all tasks automatically.',
  })
  async deleteTag(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<DeleteTagPayload> {
    return this.deleteTagUseCase.execute(id);
  }
}
