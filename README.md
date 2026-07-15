<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<h1 align="center">Mini Task Manager — GraphQL API</h1>

<p align="center">
  A production-grade GraphQL API for managing daily tasks, built with
  <a href="https://nestjs.com" target="_blank">NestJS</a>,
  <a href="https://www.apollographql.com/docs/apollo-server" target="_blank">Apollo Server</a> and
  <a href="https://www.prisma.io" target="_blank">Prisma</a> on Clean Architecture.
</p>

<p align="center">
  <a href="https://github.com/MoeeinAali/NestJS-GraphQL/actions/workflows/ci.yml" target="_blank"><img src="https://github.com/MoeeinAali/NestJS-GraphQL/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/node-%E2%89%A522-brightgreen" alt="Node >= 22" />
  <img src="https://img.shields.io/badge/NestJS-11-e0234e" alt="NestJS 11" />
  <img src="https://img.shields.io/badge/GraphQL-code--first-e10098" alt="GraphQL code-first" />
  <img src="https://img.shields.io/badge/Prisma-SQLite-2d3748" alt="Prisma + SQLite" />
</p>

## Description

Users create tasks, edit or delete them, and move each task between **TODO**, **DOING** and **DONE**. A task carries a title, an optional description, a priority (`LOW` / `MEDIUM` / `HIGH`), an optional due date and a set of tags. The API exposes list queries with filtering, sorting and offset pagination, plus full CRUD for tasks and tags — all through a single, strongly-typed GraphQL schema ([`src/schema.gql`](src/schema.gql), generated code-first from TypeScript decorators).

### Features

- **GraphQL API (Apollo Server 4/5 via `@nestjs/apollo`)** — code-first schema, Apollo Sandbox at `/graphql`
- **Tasks** — create / update (partial, with explicit-`null` clearing) / delete / change status freely between any states
- **Tags** — CRUD, unique names, hex colors, many-to-many with tasks
- **Querying** — filter by status, priority, tags, full-text-ish search, due-date range; sort by five fields; offset pagination with `totalCount` / `hasNextPage`
- **N+1 safe** — `Tag.tasks` is resolved through a per-request DataLoader
- **Typed errors** — machine-readable `extensions.code`: `NOT_FOUND`, `CONFLICT`, `BAD_REQUEST`, `VALIDATION_ERROR`
- **Hardened** — input validation (class-validator), query depth limit, env validation at boot, health endpoint
- **Tested** — 62 unit tests (domain + use cases, zero DB) and 23 e2e tests against a real SQLite database
- **Ops-ready** — multi-stage Dockerfile (non-root, auto-migrations, healthcheck), docker-compose, GitHub Actions CI

## Architecture

The project follows **Clean Architecture**: each feature module (`tasks`, `tags`) is split into four layers, and dependencies only ever point inward. The domain knows nothing about NestJS, Prisma or GraphQL.

```
src/
├── common/                    # cross-cutting: config validation, error codes,
│   │                          #   GraphQL pagination input, exception filter, pipes
├── infrastructure/prisma/     # PrismaService (the only place touching the DB driver)
├── health/                    # REST /health probe for orchestrators
└── modules/
    ├── tasks/
    │   ├── domain/            # Task entity + invariants, TaskStatus/Priority enums,
    │   │                      #   TaskRepository PORT (interface), domain errors
    │   ├── application/       # one use case per operation (CreateTask, ListTasks, …)
    │   ├── infrastructure/    # TaskPrismaRepository ADAPTER + row↔entity mapper
    │   └── presentation/      # resolvers, object/input types, DataLoader
    └── tags/                  # same layering
```

**Why bother?**

- *Business rules live in one place.* Title validation, default status, tag replacement semantics — all inside the `Task` entity, unit-testable without a database.
- *The database is a plugin.* Use cases depend on the `TaskRepository` **interface**; Prisma/SQLite is just an adapter. Swapping to PostgreSQL means editing `prisma/schema.prisma` and nothing above the infrastructure layer.
- *GraphQL is a delivery detail.* Resolvers only translate between GraphQL inputs and use-case calls; you could bolt a REST controller onto the same use cases tomorrow.

Two design notes worth knowing:

- SQLite (via Prisma) has no native enums, so `status` is stored as a string and `priority` as an integer (1–3) — which also makes `ORDER BY priority` semantically correct. The mappers in `infrastructure/` own that translation.
- The `Tag.tasks` field resolver lives in the **tasks** module (`TagTasksResolver`), keeping the module graph acyclic (`tasks → tags`, never back) and batching lookups through a request-scoped DataLoader.

## API overview

Endpoint: `POST /graphql` — open `http://localhost:3000/graphql` in a browser for **Apollo Sandbox**.

| Operation | Kind | Purpose |
|---|---|---|
| `tasks(filter, pagination, sort): TaskPage!` | Query | List with filtering / sorting / pagination |
| `task(id): Task` | Query | Single task (null if missing) |
| `tags: [Tag!]!`, `tag(id): Tag` | Query | Tags, sorted by name |
| `createTask(input): Task!` | Mutation | Title required; priority defaults to `MEDIUM` |
| `updateTask(id, input): Task!` | Mutation | Partial; `null` clears description/dueDate; `tagIds` replaces the set |
| `changeTaskStatus(id, status): Task!` | Mutation | Any state → any state |
| `deleteTask(id): DeleteTaskPayload!` | Mutation | — |
| `createTag / updateTag / deleteTag` | Mutation | Unique names, hex colors |

Example — create, then query with a filter:

```graphql
mutation {
  createTask(
    input: {
      title: "Submit HW4"
      priority: HIGH
      dueDate: "2026-08-01T12:00:00Z"
      tagIds: ["<tag-id>"]
    }
  ) {
    id
    status
    tags { name color }
  }
}

query {
  tasks(
    filter: { status: TODO, search: "HW" }
    sort: { field: DUE_DATE, direction: ASC }
    pagination: { skip: 0, take: 10 }
  ) {
    totalCount
    hasNextPage
    items { id title priority dueDate }
  }
}
```

Errors carry a machine-readable code:

```json
{ "message": "Task with id \"…\" was not found", "extensions": { "code": "NOT_FOUND" } }
```

| Code | Meaning |
|---|---|
| `NOT_FOUND` | Task/tag id does not exist |
| `CONFLICT` | Duplicate tag name |
| `BAD_REQUEST` | Input failed validation (message lists the violated rules) |
| `INTERNAL_SERVER_ERROR` | Unexpected failure (masked in production) |

## Project setup

Requires Node.js ≥ 22.

```bash
$ npm install

# create .env (see .env.example), then create the SQLite db + tables
$ cp .env.example .env
$ npx prisma migrate dev
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run build && npm run start:prod
```

## Run tests

```bash
# unit tests (domain + use cases, no database)
$ npm run test

# e2e tests (real GraphQL requests against a throwaway SQLite db)
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Docker

```bash
$ docker compose up --build
```

The container applies pending Prisma migrations on start, runs as a non-root user, exposes the API on port 3000 and persists the SQLite file on a named volume. Behind a private npm registry mirror? Pass your npmrc as a BuildKit secret (it never enters an image layer):

```bash
$ docker build --secret id=npmrc,src=$HOME/.npmrc -t task-manager .
```

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- [NestJS + GraphQL (code-first)](https://docs.nestjs.com/graphql/quick-start) — the approach used here.
- [Prisma Documentation](https://www.prisma.io/docs) — schema, migrations and the typed client.
- [DataLoader](https://github.com/graphql/dataloader) — the batching pattern behind `Tag.tasks`.

## License

Built by [Moeein Aali](https://github.com/MoeeinAali) for the CE222 course (Sharif University of Technology). Based on the MIT-licensed [NestJS](https://github.com/nestjs/nest) starter.
