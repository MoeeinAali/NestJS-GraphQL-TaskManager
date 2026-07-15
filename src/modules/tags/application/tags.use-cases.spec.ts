import { Tag } from '../domain/tag.entity';
import {
  TagNameAlreadyExistsError,
  TagNotFoundError,
} from '../domain/tag.errors';
import { InMemoryTagRepository } from './testing/in-memory-tag.repository';
import { CreateTagUseCase } from './create-tag.use-case';
import { DeleteTagUseCase } from './delete-tag.use-case';
import { GetTagUseCase } from './get-tag.use-case';
import { ListTagsUseCase } from './list-tags.use-case';
import { UpdateTagUseCase } from './update-tag.use-case';

describe('Tag use cases', () => {
  let repository: InMemoryTagRepository;

  beforeEach(() => {
    repository = new InMemoryTagRepository();
  });

  describe('CreateTagUseCase', () => {
    it('creates a tag with a normalized name', async () => {
      const tag = await new CreateTagUseCase(repository).execute({
        name: '  work  ',
        color: '#ff0000',
      });

      expect(tag.name).toBe('work');
      expect(tag.color).toBe('#ff0000');
      await expect(repository.findById(tag.id)).resolves.toBe(tag);
    });

    it('rejects duplicate names (after trimming)', async () => {
      const useCase = new CreateTagUseCase(repository);
      await useCase.execute({ name: 'work' });

      await expect(useCase.execute({ name: '  work ' })).rejects.toThrow(
        TagNameAlreadyExistsError,
      );
    });
  });

  describe('UpdateTagUseCase', () => {
    it('throws for unknown tags', async () => {
      await expect(
        new UpdateTagUseCase(repository).execute('nope', { name: 'x' }),
      ).rejects.toThrow(TagNotFoundError);
    });

    it('renames and recolors', async () => {
      const tag = await repository.create(Tag.create({ name: 'old' }));

      const updated = await new UpdateTagUseCase(repository).execute(tag.id, {
        name: 'new',
        color: '#123456',
      });

      expect(updated.name).toBe('new');
      expect(updated.color).toBe('#123456');
    });

    it('rejects a rename that collides with another tag', async () => {
      await repository.create(Tag.create({ name: 'taken' }));
      const tag = await repository.create(Tag.create({ name: 'mine' }));

      await expect(
        new UpdateTagUseCase(repository).execute(tag.id, { name: 'taken' }),
      ).rejects.toThrow(TagNameAlreadyExistsError);
    });

    it('allows re-saving the same name on the same tag', async () => {
      const tag = await repository.create(Tag.create({ name: 'same' }));

      await expect(
        new UpdateTagUseCase(repository).execute(tag.id, { name: 'same' }),
      ).resolves.toHaveProperty('name', 'same');
    });
  });

  describe('DeleteTagUseCase', () => {
    it('throws for unknown tags', async () => {
      await expect(
        new DeleteTagUseCase(repository).execute('nope'),
      ).rejects.toThrow(TagNotFoundError);
    });

    it('deletes and returns the id', async () => {
      const tag = await repository.create(Tag.create({ name: 't' }));

      await expect(
        new DeleteTagUseCase(repository).execute(tag.id),
      ).resolves.toEqual({
        id: tag.id,
      });
      await expect(repository.findById(tag.id)).resolves.toBeNull();
    });
  });

  describe('GetTagUseCase / ListTagsUseCase', () => {
    it('gets by id or null', async () => {
      const tag = await repository.create(Tag.create({ name: 't' }));
      const useCase = new GetTagUseCase(repository);

      await expect(useCase.execute(tag.id)).resolves.toBe(tag);
      await expect(useCase.execute('nope')).resolves.toBeNull();
    });

    it('lists all tags', async () => {
      await repository.create(Tag.create({ name: 'a' }));
      await repository.create(Tag.create({ name: 'b' }));

      const tags = await new ListTagsUseCase(repository).execute();
      expect(tags.map((t) => t.name).sort()).toEqual(['a', 'b']);
    });
  });
});
