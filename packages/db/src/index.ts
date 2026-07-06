export { getPool, closePool } from "./pool.js";
export { getWorkspace } from "./workspaces.js";
export type { WorkspaceRow, WorkspaceStatus } from "./workspaces.js";
export { insertMessage, recentMessages } from "./messages.js";
export type { MessageRow, NewMessage } from "./messages.js";
export { insertKnowledge, matchKnowledge } from "./knowledge.js";
export type { KnowledgeMatch, NewKnowledge } from "./knowledge.js";
export { runMigrations, getLatestAppliedMigration } from "./migrate.js";
