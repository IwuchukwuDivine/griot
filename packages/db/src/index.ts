export { EMBEDDING_DIM } from "./constants.js";
export { getPool, closePool } from "./pool.js";
export { getWorkspace, listActiveWorkspaces } from "./workspaces.js";
export type { WorkspaceRow, WorkspaceStatus } from "./workspaces.js";
export {
  activeChannels,
  channelMessagesSince,
  insertMessage,
  mostRecentChannel,
  recentMessages,
} from "./messages.js";
export type { MessageRow, NewMessage } from "./messages.js";
export { insertKnowledge, matchKnowledge } from "./knowledge.js";
export type { KnowledgeMatch, NewKnowledge } from "./knowledge.js";
export {
  insertDecision,
  matchDecisions,
  latestDecision,
  softDeleteDecision,
} from "./decisions.js";
export type { DecisionMatch, DecisionRow, NewDecision } from "./decisions.js";
export {
  completeTodo,
  dueOpenTodos,
  insertTodo,
  openTodos,
  updateTodo,
} from "./todos.js";
export type { NewTodo, TodoPatch, TodoRow } from "./todos.js";
export { runMigrations, getLatestAppliedMigration } from "./migrate.js";
