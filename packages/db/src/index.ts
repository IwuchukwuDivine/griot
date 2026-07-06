export { EMBEDDING_DIM } from "./constants.js";
export { getPool, closePool } from "./pool.js";
export {
  getWorkspace,
  listActiveWorkspaces,
  upsertWorkspace,
} from "./workspaces.js";
export type {
  UpsertWorkspace,
  WorkspaceRow,
  WorkspaceStatus,
} from "./workspaces.js";
export {
  activeChannels,
  channelMessagesSince,
  countHumanMessages,
  insertMessage,
  latestSourcedBotMessage,
  mostRecentChannel,
  recentMessages,
} from "./messages.js";
export { incrementDailyChatCount } from "./chat-usage.js";
export type {
  KnowledgeSource,
  MessageRow,
  MessageSources,
  NewMessage,
} from "./messages.js";
export {
  insertKnowledge,
  matchKnowledge,
  supersedeKnowledge,
} from "./knowledge.js";
export type { KnowledgeMatch, NewKnowledge } from "./knowledge.js";
export {
  insertDecision,
  latestDecision,
  latestPendingConflict,
  matchDecisions,
  setDecisionConflict,
  softDeleteDecision,
  supersedeDecision,
} from "./decisions.js";
export type {
  DecisionMatch,
  DecisionRow,
  NewDecision,
  PendingConflict,
} from "./decisions.js";
export {
  completeTodo,
  dueOpenTodos,
  insertTodo,
  openTodos,
  updateTodo,
} from "./todos.js";
export type { NewTodo, TodoPatch, TodoRow } from "./todos.js";
export { claimEvent, pruneProcessedEvents } from "./events.js";
export { runMigrations, getLatestAppliedMigration } from "./migrate.js";
