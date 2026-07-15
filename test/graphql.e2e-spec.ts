import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';

interface GqlResponse {
  data?: Record<string, any> | null;
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
}

describe('GraphQL API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const gql = async (
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<GqlResponse> => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query, variables })
      .expect(200);
    return response.body as GqlResponse;
  };

  const createTag = async (name: string, color?: string): Promise<string> => {
    const body = await gql(
      `mutation ($input: CreateTagInput!) {
         createTag(input: $input) { id }
       }`,
      { input: { name, ...(color ? { color } : {}) } },
    );
    return body.data!.createTag.id as string;
  };

  const createTask = async (
    input: Record<string, unknown>,
  ): Promise<string> => {
    const body = await gql(
      `mutation ($input: CreateTaskInput!) {
         createTask(input: $input) { id }
       }`,
      { input },
    );
    return body.data!.createTask.id as string;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.task.deleteMany();
    await prisma.tag.deleteMany();
  });

  describe('createTask', () => {
    it('creates a task with defaults', async () => {
      const body = await gql(`
        mutation {
          createTask(input: { title: "Buy groceries" }) {
            id title description status priority dueDate tags { id } createdAt updatedAt
          }
        }
      `);

      const task = body.data!.createTask;
      expect(task.title).toBe('Buy groceries');
      expect(task.description).toBeNull();
      expect(task.status).toBe('TODO');
      expect(task.priority).toBe('MEDIUM');
      expect(task.dueDate).toBeNull();
      expect(task.tags).toEqual([]);
      expect(new Date(task.createdAt).getTime()).not.toBeNaN();
    });

    it('creates a task with all fields and resolves tags', async () => {
      const tagId = await createTag('uni', '#3366ff');

      const body = await gql(
        `mutation ($input: CreateTaskInput!) {
           createTask(input: $input) {
             title description status priority dueDate
             tags { id name color }
           }
         }`,
        {
          input: {
            title: 'Submit HW4',
            description: 'GraphQL assignment',
            priority: 'HIGH',
            dueDate: '2026-08-01T12:00:00.000Z',
            tagIds: [tagId],
          },
        },
      );

      const task = body.data!.createTask;
      expect(task.priority).toBe('HIGH');
      expect(task.dueDate).toBe('2026-08-01T12:00:00.000Z');
      expect(task.tags).toEqual([{ id: tagId, name: 'uni', color: '#3366ff' }]);
    });

    it('rejects unknown tag ids with NOT_FOUND', async () => {
      const body = await gql(
        `mutation ($input: CreateTaskInput!) {
           createTask(input: $input) { id }
         }`,
        { input: { title: 'T', tagIds: ['ghost-tag'] } },
      );

      expect(body.data).toBeNull();
      expect(body.errors![0].extensions!.code).toBe('NOT_FOUND');
      expect(body.errors![0].message).toContain('ghost-tag');
    });

    it('rejects a blank title with BAD_REQUEST', async () => {
      const body = await gql(
        `mutation ($input: CreateTaskInput!) {
           createTask(input: $input) { id }
         }`,
        { input: { title: '' } },
      );

      expect(body.errors![0].extensions!.code).toBe('BAD_REQUEST');
      expect(body.errors![0].message).toContain('title');
    });
  });

  describe('task query', () => {
    it('returns a task by id and null for unknown ids', async () => {
      const id = await createTask({ title: 'Find me' });

      const found = await gql(
        `query ($id: ID!) { task(id: $id) { id title } }`,
        { id },
      );
      expect(found.data!.task).toEqual({ id, title: 'Find me' });

      const missing = await gql(`query { task(id: "does-not-exist") { id } }`);
      expect(missing.data!.task).toBeNull();
      expect(missing.errors).toBeUndefined();
    });
  });

  describe('tasks query (filtering, sorting, pagination)', () => {
    it('filters by status', async () => {
      const doneId = await createTask({ title: 'done task' });
      await createTask({ title: 'todo task' });
      await gql(
        `mutation ($id: ID!) { changeTaskStatus(id: $id, status: DONE) { id } }`,
        { id: doneId },
      );

      const body = await gql(
        `query { tasks(filter: { status: DONE }) { totalCount items { title status } } }`,
      );

      expect(body.data!.tasks.totalCount).toBe(1);
      expect(body.data!.tasks.items[0]).toEqual({
        title: 'done task',
        status: 'DONE',
      });
    });

    it('filters by priority, tag, search and due date range', async () => {
      const tagId = await createTag('work');
      await createTask({
        title: 'urgent report',
        priority: 'HIGH',
        dueDate: '2026-07-20T00:00:00.000Z',
        tagIds: [tagId],
      });
      await createTask({
        title: 'later chore',
        priority: 'LOW',
        dueDate: '2026-09-01T00:00:00.000Z',
      });

      const byPriority = await gql(
        `query { tasks(filter: { priority: HIGH }) { items { title } } }`,
      );
      expect(byPriority.data!.tasks.items).toEqual([
        { title: 'urgent report' },
      ]);

      const byTag = await gql(
        `query ($tagIds: [ID!]) { tasks(filter: { tagIds: $tagIds }) { items { title } } }`,
        { tagIds: [tagId] },
      );
      expect(byTag.data!.tasks.items).toEqual([{ title: 'urgent report' }]);

      const bySearch = await gql(
        `query { tasks(filter: { search: "chore" }) { items { title } } }`,
      );
      expect(bySearch.data!.tasks.items).toEqual([{ title: 'later chore' }]);

      const byDue = await gql(
        `query { tasks(filter: { dueBefore: "2026-08-01T00:00:00.000Z" }) { items { title } } }`,
      );
      expect(byDue.data!.tasks.items).toEqual([{ title: 'urgent report' }]);
    });

    it('sorts by priority in semantic order', async () => {
      await createTask({ title: 'medium', priority: 'MEDIUM' });
      await createTask({ title: 'low', priority: 'LOW' });
      await createTask({ title: 'high', priority: 'HIGH' });

      const body = await gql(
        `query {
           tasks(sort: { field: PRIORITY, direction: DESC }) { items { title } }
         }`,
      );

      expect(
        body.data!.tasks.items.map((t: { title: string }) => t.title),
      ).toEqual(['high', 'medium', 'low']);
    });

    it('paginates with totalCount and hasNextPage', async () => {
      for (let i = 1; i <= 5; i++) {
        await createTask({ title: `task ${i}` });
      }

      const firstPage = await gql(
        `query { tasks(pagination: { take: 2 }, sort: { field: TITLE, direction: ASC }) {
           totalCount hasNextPage items { title }
         } }`,
      );
      expect(firstPage.data!.tasks.totalCount).toBe(5);
      expect(firstPage.data!.tasks.hasNextPage).toBe(true);
      expect(
        firstPage.data!.tasks.items.map((t: { title: string }) => t.title),
      ).toEqual(['task 1', 'task 2']);

      const lastPage = await gql(
        `query { tasks(pagination: { skip: 4, take: 2 }, sort: { field: TITLE, direction: ASC }) {
           hasNextPage items { title }
         } }`,
      );
      expect(lastPage.data!.tasks.hasNextPage).toBe(false);
      expect(lastPage.data!.tasks.items).toEqual([{ title: 'task 5' }]);
    });

    it('rejects an oversized page with BAD_REQUEST', async () => {
      const body = await gql(
        `query { tasks(pagination: { take: 500 }) { totalCount } }`,
      );
      expect(body.errors![0].extensions!.code).toBe('BAD_REQUEST');
    });
  });

  describe('updateTask', () => {
    it('applies partial updates and clears nullable fields with null', async () => {
      const id = await createTask({
        title: 'Original',
        description: 'desc',
        dueDate: '2026-08-01T00:00:00.000Z',
      });

      const body = await gql(
        `mutation ($id: ID!, $input: UpdateTaskInput!) {
           updateTask(id: $id, input: $input) { title description dueDate priority }
         }`,
        {
          id,
          input: { title: 'Renamed', description: null, dueDate: null },
        },
      );

      expect(body.data!.updateTask).toEqual({
        title: 'Renamed',
        description: null,
        dueDate: null,
        priority: 'MEDIUM',
      });
    });

    it('replaces the tag set', async () => {
      const oldTag = await createTag('old');
      const newTag = await createTag('new');
      const id = await createTask({ title: 'T', tagIds: [oldTag] });

      const body = await gql(
        `mutation ($id: ID!, $input: UpdateTaskInput!) {
           updateTask(id: $id, input: $input) { tags { id name } }
         }`,
        { id, input: { tagIds: [newTag] } },
      );

      expect(body.data!.updateTask.tags).toEqual([{ id: newTag, name: 'new' }]);
    });

    it('returns NOT_FOUND for unknown tasks', async () => {
      const body = await gql(
        `mutation { updateTask(id: "ghost", input: { title: "x" }) { id } }`,
      );
      expect(body.errors![0].extensions!.code).toBe('NOT_FOUND');
    });
  });

  describe('changeTaskStatus', () => {
    it('moves freely between all statuses', async () => {
      const id = await createTask({ title: 'T' });

      for (const status of ['DONE', 'TODO', 'DOING']) {
        const body = await gql(
          `mutation ($id: ID!, $status: TaskStatus!) {
             changeTaskStatus(id: $id, status: $status) { status }
           }`,
          { id, status },
        );
        expect(body.data!.changeTaskStatus.status).toBe(status);
      }
    });

    it('returns NOT_FOUND for unknown tasks', async () => {
      const body = await gql(
        `mutation { changeTaskStatus(id: "ghost", status: DONE) { id } }`,
      );
      expect(body.errors![0].extensions!.code).toBe('NOT_FOUND');
    });
  });

  describe('deleteTask', () => {
    it('deletes and reports the id; the task is gone afterwards', async () => {
      const id = await createTask({ title: 'doomed' });

      const del = await gql(
        `mutation ($id: ID!) { deleteTask(id: $id) { id } }`,
        { id },
      );
      expect(del.data!.deleteTask.id).toBe(id);

      const lookup = await gql(`query ($id: ID!) { task(id: $id) { id } }`, {
        id,
      });
      expect(lookup.data!.task).toBeNull();

      const again = await gql(
        `mutation ($id: ID!) { deleteTask(id: $id) { id } }`,
        { id },
      );
      expect(again.errors![0].extensions!.code).toBe('NOT_FOUND');
    });
  });

  describe('tags', () => {
    it('creates, lists (sorted by name), updates and deletes tags', async () => {
      const b = await createTag('beta');
      await createTag('alpha');

      const list = await gql(`query { tags { name } }`);
      expect(list.data!.tags).toEqual([{ name: 'alpha' }, { name: 'beta' }]);

      const renamed = await gql(
        `mutation ($id: ID!) { updateTag(id: $id, input: { name: "gamma", color: "#00ff00" }) { name color } }`,
        { id: b },
      );
      expect(renamed.data!.updateTag).toEqual({
        name: 'gamma',
        color: '#00ff00',
      });

      const del = await gql(
        `mutation ($id: ID!) { deleteTag(id: $id) { id } }`,
        { id: b },
      );
      expect(del.data!.deleteTag.id).toBe(b);
    });

    it('rejects duplicate names with CONFLICT', async () => {
      await createTag('unique');
      const dupe = await gql(
        `mutation { createTag(input: { name: "unique" }) { id } }`,
      );
      expect(dupe.errors![0].extensions!.code).toBe('CONFLICT');

      const other = await createTag('other');
      const rename = await gql(
        `mutation ($id: ID!) { updateTag(id: $id, input: { name: "unique" }) { id } }`,
        { id: other },
      );
      expect(rename.errors![0].extensions!.code).toBe('CONFLICT');
    });

    it('rejects an invalid color with BAD_REQUEST', async () => {
      const body = await gql(
        `mutation { createTag(input: { name: "t", color: "red" }) { id } }`,
      );
      expect(body.errors![0].extensions!.code).toBe('BAD_REQUEST');
      expect(body.errors![0].message).toContain('hex color');
    });

    it('detaches deleted tags from tasks', async () => {
      const tagId = await createTag('temp');
      const taskId = await createTask({ title: 'T', tagIds: [tagId] });

      await gql(`mutation ($id: ID!) { deleteTag(id: $id) { id } }`, {
        id: tagId,
      });

      const body = await gql(
        `query ($id: ID!) { task(id: $id) { tags { id } } }`,
        { id: taskId },
      );
      expect(body.data!.task.tags).toEqual([]);
    });

    it('resolves Tag.tasks through the DataLoader', async () => {
      const work = await createTag('work');
      const home = await createTag('home');
      await createTask({ title: 'A', tagIds: [work] });
      await createTask({ title: 'B', tagIds: [work, home] });

      const body = await gql(`query { tags { name tasks { title } } }`);

      expect(body.data!.tags).toEqual([
        { name: 'home', tasks: [{ title: 'B' }] },
        { name: 'work', tasks: [{ title: 'A' }, { title: 'B' }] },
      ]);
    });
  });

  describe('health endpoint', () => {
    it('reports ok while the database is reachable', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);
      expect(response.body).toEqual({ status: 'ok', database: 'up' });
    });
  });

  describe('query safety', () => {
    it('rejects queries nested deeper than the depth limit', async () => {
      // Apollo answers GraphQL validation failures with HTTP 400,
      // so this bypasses the 200-asserting helper.
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              tasks {
                items {
                  tags {
                    tasks {
                      tags {
                        tasks {
                          tags { name }
                        }
                      }
                    }
                  }
                }
              }
            }
          `,
        })
        .expect(400);

      const body = response.body as GqlResponse;
      expect(body.errors).toBeDefined();
      expect(body.errors![0].message).toMatch(/depth/i);
    });
  });
});
