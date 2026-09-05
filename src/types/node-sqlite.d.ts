// Minimal ambient types for node:sqlite (stable in Node 22.5+, this repo
// targets Node 24). @types/node@20 (pinned for vitest@2 peer compatibility
// — see package.json) does not ship these yet, so they're declared here
// rather than bumping @types/node and reopening that dependency conflict.
// Covers only the surface area actually used in src/server/persistence.
declare module "node:sqlite" {
  export interface StatementResultingChanges {
    changes: number | bigint;
    lastInsertRowid: number | bigint;
  }

  export class StatementSync {
    run(...params: unknown[]): StatementResultingChanges;
    get(...params: unknown[]): Record<string, unknown> | undefined;
    all(...params: unknown[]): Array<Record<string, unknown>>;
  }

  export class DatabaseSync {
    constructor(path: string, options?: Record<string, unknown>);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
