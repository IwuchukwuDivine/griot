// Seeds the public web demo's knowledge base from scripts/demo-kb.md:
// each paragraph is one fact, embedded and inserted into the demo workspace,
// with its section heading as the source (that's what the widget's memory
// chips display). Idempotent — wipes the workspace's knowledge rows first.
//
// Run with `npm run seed:demo` (builds first; needs Node >= 22.6 for
// --experimental-strip-types and a populated .env).

import { readFile } from "node:fs/promises";
import { getLlm } from "@griot/agent";
import { closePool, getPool, insertKnowledge } from "@griot/db";

interface Fact {
  source: string;
  content: string;
}

function slugify(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Headings become sources; every other paragraph is a fact to embed. */
function parseFacts(md: string): Fact[] {
  const facts: Fact[] = [];
  let source = "demo-kb";
  for (const block of md.split(/\n\s*\n/)) {
    const text = block.trim();
    if (!text) {
      continue;
    }
    if (text.startsWith("#")) {
      source = slugify(text.replace(/^#+\s*/, "")) || "demo-kb";
      continue;
    }
    facts.push({ source, content: text.replace(/\s+/g, " ") });
  }
  return facts;
}

const workspaceId = process.env.DEMO_WORKSPACE_ID ?? "griot-web-demo";
const md = await readFile(new URL("./demo-kb.md", import.meta.url), "utf8");
const facts = parseFacts(md);
if (facts.length === 0) {
  throw new Error("scripts/demo-kb.md contained no facts");
}

const pool = getPool();
// Migration 007 creates this row; keep the script self-sufficient anyway.
await pool.query(
  `INSERT INTO workspaces (workspace_id, team_name, status)
   VALUES ($1, 'Griot web demo', 'active')
   ON CONFLICT (workspace_id) DO NOTHING`,
  [workspaceId],
);
const wiped = await pool.query("DELETE FROM knowledge WHERE workspace_id = $1", [
  workspaceId,
]);
console.log(`wiped ${wiped.rowCount ?? 0} knowledge rows from ${workspaceId}`);

const llm = getLlm();
for (const [index, fact] of facts.entries()) {
  const embedding = await llm.embed(fact.content);
  await insertKnowledge({
    workspaceId,
    content: fact.content,
    source: fact.source,
    embedding,
  });
  console.log(`seeded ${index + 1}/${facts.length} [${fact.source}]`);
}

await closePool();
console.log(`done — ${facts.length} facts in ${workspaceId}`);
