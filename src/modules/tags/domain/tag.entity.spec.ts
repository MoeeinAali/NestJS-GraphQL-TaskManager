import { InvalidTagNameError } from './tag.errors';
import { Tag } from './tag.entity';

describe('Tag entity', () => {
  describe('create', () => {
    it('creates a tag with defaults', () => {
      const tag = Tag.create({ name: 'work' });

      expect(tag.id).toMatch(/^[0-9a-f-]{36}$/i);
      expect(tag.name).toBe('work');
      expect(tag.color).toBeNull();
      expect(tag.createdAt).toBeInstanceOf(Date);
    });

    it('accepts an optional color', () => {
      expect(Tag.create({ name: 'work', color: '#ff0000' }).color).toBe(
        '#ff0000',
      );
    });

    it('trims the name', () => {
      expect(Tag.create({ name: '  home  ' }).name).toBe('home');
    });

    it.each(['', '   '])('rejects blank name %j', (name) => {
      expect(() => Tag.create({ name })).toThrow(InvalidTagNameError);
    });

    it('rejects names longer than 50 characters', () => {
      expect(() => Tag.create({ name: 'x'.repeat(51) })).toThrow(
        InvalidTagNameError,
      );
    });
  });

  describe('update', () => {
    it('renames with validation', () => {
      const tag = Tag.create({ name: 'old' });

      tag.update({ name: 'new' });
      expect(tag.name).toBe('new');

      expect(() => tag.update({ name: ' ' })).toThrow(InvalidTagNameError);
    });

    it('sets and clears the color', () => {
      const tag = Tag.create({ name: 't', color: '#00ff00' });

      tag.update({ color: null });
      expect(tag.color).toBeNull();

      tag.update({ color: '#123456' });
      expect(tag.color).toBe('#123456');
    });

    it('leaves omitted fields untouched', () => {
      const tag = Tag.create({ name: 'keep', color: '#abcdef' });

      tag.update({});

      expect(tag.name).toBe('keep');
      expect(tag.color).toBe('#abcdef');
    });
  });

  describe('reconstitute', () => {
    it('restores a tag as-is', () => {
      const props = {
        id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        name: 'restored',
        color: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      };

      const tag = Tag.reconstitute(props);

      expect(tag.id).toBe(props.id);
      expect(tag.name).toBe('restored');
      expect(tag.createdAt).toEqual(props.createdAt);
    });
  });
});
