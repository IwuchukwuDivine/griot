import { getPool } from "./pool.js";

export interface TodoRow {
  id: string;
  workspace_id: string;
  task: string;
  owner: string | null;
  deadline: Date | null;
  status: string;
  channel_id: string | null;
  created_at: Date;
  done_at: Date | null;
}

export interface NewTodo {
  workspaceId: string;
  task: string;
  owner: string | null;
  deadline: Date | null;
  /** Where the todo was created — deadline reminders post back here. */
  channelId: string | null;
}

const TODO_COLUMNS =
  "id, workspace_id, task, owner, deadline, status, channel_id, created_at, done_at";

export async function insertTodo(todo: NewTodo): Promise<void> {
  await getPool().query(
    `INSERT INTO todos (workspace_id, task, owner, deadline, channel_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [todo.workspaceId, todo.task, todo.owner, todo.deadline, todo.channelId],
  );
}

/** Open todos, soonest deadline first, undated ones last. */
export async function openTodos(workspaceId: string): Promise<TodoRow[]> {
  const result = await getPool().query<TodoRow>(
    `SELECT ${TODO_COLUMNS}
       FROM todos
      WHERE workspace_id = $1 AND status = 'open'
      ORDER BY deadline ASC NULLS LAST, created_at ASC`,
    [workspaceId],
  );
  return result.rows;
}

/**
 * Open todos due on `dayStart`'s calendar day or earlier. `dayStart` is
 * midnight of today in the team timezone; anything before the following
 * midnight counts, so mid-day deadlines aren't missed.
 */
export async function dueOpenTodos(
  workspaceId: string,
  dayStart: Date,
): Promise<TodoRow[]> {
  const result = await getPool().query<TodoRow>(
    `SELECT ${TODO_COLUMNS}
       FROM todos
      WHERE workspace_id = $1
        AND status = 'open'
        AND deadline IS NOT NULL
        AND deadline < $2::TIMESTAMPTZ + INTERVAL '1 day'
      ORDER BY deadline ASC`,
    [workspaceId, dayStart],
  );
  return result.rows;
}

/** Marks a todo done; returns the row, or null if it wasn't an open todo here. */
export async function completeTodo(
  id: string,
  workspaceId: string,
): Promise<TodoRow | null> {
  const result = await getPool().query<TodoRow>(
    `UPDATE todos
        SET status = 'done', done_at = now()
      WHERE id = $1 AND workspace_id = $2 AND status = 'open'
      RETURNING ${TODO_COLUMNS}`,
    [id, workspaceId],
  );
  return result.rows[0] ?? null;
}

export interface TodoPatch {
  /** null means "leave unchanged" — todos never go back to having no owner/deadline. */
  owner: string | null;
  deadline: Date | null;
}

/** Applies the non-null patch fields; returns the row, or null if no open match. */
export async function updateTodo(
  id: string,
  workspaceId: string,
  patch: TodoPatch,
): Promise<TodoRow | null> {
  const result = await getPool().query<TodoRow>(
    `UPDATE todos
        SET owner = COALESCE($3::STRING, owner),
            deadline = COALESCE($4::TIMESTAMPTZ, deadline)
      WHERE id = $1 AND workspace_id = $2 AND status = 'open'
      RETURNING ${TODO_COLUMNS}`,
    [id, workspaceId, patch.owner, patch.deadline],
  );
  return result.rows[0] ?? null;
}
