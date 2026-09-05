// Default test DB is in-memory and private to each test file (vitest
// isolates modules per file by default, so db.ts's module-level
// singleton doesn't leak across files even though this setup file runs
// once per worker). The restart-simulation test overrides
// HIREWALL_DB_PATH to a real temp file for the duration of its own file,
// since ":memory:" data is genuinely gone on "restart" — that's the
// point of using a file there instead.
if (!process.env.HIREWALL_DB_PATH) {
  process.env.HIREWALL_DB_PATH = ":memory:";
}
