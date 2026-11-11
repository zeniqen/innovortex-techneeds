/**
 * The database schema.
 *
 * The tables are created by `migrate` on first use, so there is no separate
 * migration step to remember. Each statement is idempotent, which means the
 * function is safe to run on every boot.
 */

/**
 * How the mentee, mentor and admin tables are alike.
 *
 * They are kept separate rather than sharing one `users` table with a role
 * column because their credentials differ: a mentee signs in with an
 * enrollment number, a mentor and an admin with an email. A shared table
 * would mean nullable, mutually exclusive columns.
 */
const MIGRATIONS: { name: string; sql: string }[] = [
  {
    name: "programs",
    sql: `
      CREATE TABLE IF NOT EXISTS programs (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        track       TEXT NOT NULL DEFAULT 'general',
        status      TEXT NOT NULL DEFAULT 'active',
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL
      );
    `,
  },
  {
    name: "mentors",
    sql: `
      CREATE TABLE IF NOT EXISTS mentors (
        id            TEXT PRIMARY KEY,
        name          TEXT NOT NULL,
        email         TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        title         TEXT NOT NULL DEFAULT 'Mentor',
        bio           TEXT NOT NULL DEFAULT '',
        skills        TEXT NOT NULL DEFAULT '[]',
        created_at    TEXT NOT NULL,
        updated_at    TEXT NOT NULL
      );
    `,
  },
  {
    name: "admins",
    sql: `
      CREATE TABLE IF NOT EXISTS admins (
        id            TEXT PRIMARY KEY,
        name          TEXT NOT NULL,
        email         TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at    TEXT NOT NULL
      );
    `,
  },
  {
    name: "mentees",
    sql: `
      CREATE TABLE IF NOT EXISTS mentees (
        id                TEXT PRIMARY KEY,
        name              TEXT NOT NULL,
        enrollment_number TEXT NOT NULL UNIQUE,
        password_hash     TEXT NOT NULL,
        bio               TEXT NOT NULL DEFAULT '',
        interests         TEXT NOT NULL DEFAULT '[]',
        total_score       INTEGER NOT NULL DEFAULT 0,
        streak            INTEGER NOT NULL DEFAULT 0,
        last_active_at    TEXT,
        created_at        TEXT NOT NULL,
        updated_at        TEXT NOT NULL
      );
    `,
  },
  {
    name: "mentor_programs",
    sql: `
      CREATE TABLE IF NOT EXISTS mentor_programs (
        mentor_id  TEXT NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
        program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
        PRIMARY KEY (mentor_id, program_id)
      );
    `,
  },
  {
    name: "mentee_programs",
    sql: `
      CREATE TABLE IF NOT EXISTS mentee_programs (
        mentee_id  TEXT NOT NULL REFERENCES mentees(id) ON DELETE CASCADE,
        program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
        PRIMARY KEY (mentee_id, program_id)
      );
    `,
  },
  {
    name: "resources",
    sql: `
      CREATE TABLE IF NOT EXISTS resources (
        id          TEXT PRIMARY KEY,
        program_id  TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
        title       TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        type        TEXT NOT NULL,
        url         TEXT NOT NULL DEFAULT '',
        max_score   INTEGER NOT NULL DEFAULT 0,
        deadline    TEXT,
        tags        TEXT NOT NULL DEFAULT '[]',
        created_by  TEXT NOT NULL DEFAULT '',
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL
      );
    `,
  },
  {
    name: "progress",
    sql: `
      CREATE TABLE IF NOT EXISTS progress (
        mentee_id    TEXT NOT NULL REFERENCES mentees(id) ON DELETE CASCADE,
        resource_id  TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
        status       TEXT NOT NULL DEFAULT 'assigned',
        score        INTEGER NOT NULL DEFAULT 0,
        started_at   TEXT,
        submitted_at TEXT,
        graded_at    TEXT,
        feedback     TEXT NOT NULL DEFAULT '',
        PRIMARY KEY (mentee_id, resource_id)
      );
    `,
  },
  {
    name: "submissions",
    sql: `
      CREATE TABLE IF NOT EXISTS submissions (
        id           TEXT PRIMARY KEY,
        mentee_id    TEXT NOT NULL REFERENCES mentees(id) ON DELETE CASCADE,
        resource_id  TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
        body         TEXT NOT NULL DEFAULT '',
        submitted_at TEXT NOT NULL,
        UNIQUE (mentee_id, resource_id)
      );
    `,
  },
  {
    name: "score_events",
    sql: `
      CREATE TABLE IF NOT EXISTS score_events (
        id          TEXT PRIMARY KEY,
        mentee_id   TEXT NOT NULL REFERENCES mentees(id) ON DELETE CASCADE,
        resource_id TEXT,
        delta       INTEGER NOT NULL,
        reason      TEXT NOT NULL DEFAULT '',
        created_at  TEXT NOT NULL
      );
    `,
  },
  {
    name: "sessions",
    sql: `
      CREATE TABLE IF NOT EXISTS sessions (
        id         TEXT PRIMARY KEY,
        role       TEXT NOT NULL,
        user_id    TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );
    `,
  },
  {
    name: "audit_log",
    sql: `
      CREATE TABLE IF NOT EXISTS audit_log (
        id         TEXT PRIMARY KEY,
        actor_id   TEXT NOT NULL DEFAULT '',
        actor_role TEXT NOT NULL DEFAULT '',
        action     TEXT NOT NULL,
        subject    TEXT NOT NULL DEFAULT '',
        detail     TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      );
    `,
  },
  {
    name: "leaderboard_index",
    sql: `CREATE INDEX IF NOT EXISTS idx_mentees_score ON mentees(total_score DESC);`,
  },
  {
    name: "resources_by_program",
    sql: `CREATE INDEX IF NOT EXISTS idx_resources_program ON resources(program_id);`,
  },
  {
    name: "progress_by_resource",
    sql: `CREATE INDEX IF NOT EXISTS idx_progress_resource ON progress(resource_id);`,
  },
];

/**
 * Creates any table that is not there yet.
 *
 * Safe to call on every boot: every statement is `IF NOT EXISTS`.
 */
export async function migrate(
  execute: (sql: string) => Promise<unknown>,
): Promise<void> {
  for (const migration of MIGRATIONS) {
    await execute(migration.sql);
  }
}
