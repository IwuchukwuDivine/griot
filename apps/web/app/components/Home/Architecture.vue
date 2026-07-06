<template>
  <section id="architecture" class="section section--muted">
    <div class="container-site">
      <span class="section-kicker">How it works</span>
      <h2 class="section-title">Serverless in front, one database behind</h2>
      <p class="section-lead">
        Slack events flow through API Gateway into a Lambda running the agent
        core; EventBridge crons drive the daily summary and deadline check.
      </p>

      <div class="arch__diagram-wrap card">
        <svg
          viewBox="0 0 900 430"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Architecture diagram: Slack events flow through API Gateway to a Lambda agent core, which calls the Gemini LLM and CockroachDB. EventBridge cron schedules trigger a jobs Lambda that reads CockroachDB and posts back to Slack."
          class="arch__svg"
        >
          <defs>
            <marker
              id="arch-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" class="arch__arrow-head" />
            </marker>
          </defs>

          <!-- Edges -->
          <line x1="172" y1="102" x2="238" y2="102" class="arch__edge" marker-end="url(#arch-arrow)" />
          <text x="205" y="88" class="arch__edge-label" text-anchor="middle">Events API</text>

          <line x1="402" y1="102" x2="468" y2="102" class="arch__edge" marker-end="url(#arch-arrow)" />

          <line x1="642" y1="88" x2="718" y2="60" class="arch__edge" marker-end="url(#arch-arrow)" />
          <line x1="642" y1="118" x2="718" y2="188" class="arch__edge" marker-end="url(#arch-arrow)" />

          <line x1="172" y1="332" x2="238" y2="332" class="arch__edge" marker-end="url(#arch-arrow)" />
          <text x="205" y="318" class="arch__edge-label" text-anchor="middle">schedules</text>

          <line x1="402" y1="322" x2="718" y2="248" class="arch__edge" marker-end="url(#arch-arrow)" />

          <path d="M 320 298 L 320 210 L 96 210 L 96 138" fill="none" class="arch__edge" marker-end="url(#arch-arrow)" />
          <text x="208" y="200" class="arch__edge-label" text-anchor="middle">posts summaries &amp; reminders</text>

          <!-- Nodes -->
          <g>
            <rect x="22" y="70" width="150" height="64" rx="12" class="arch__node" />
            <text x="97" y="98" class="arch__node-title" text-anchor="middle">Slack</text>
            <text x="97" y="116" class="arch__node-sub" text-anchor="middle">your workspace</text>
          </g>

          <g>
            <rect x="240" y="70" width="162" height="64" rx="12" class="arch__node" />
            <text x="321" y="98" class="arch__node-title" text-anchor="middle">API Gateway</text>
            <text x="321" y="116" class="arch__node-sub" text-anchor="middle">events + OAuth</text>
          </g>

          <g>
            <rect x="470" y="70" width="172" height="64" rx="12" class="arch__node" />
            <text x="556" y="98" class="arch__node-title" text-anchor="middle">Lambda</text>
            <text x="556" y="116" class="arch__node-sub" text-anchor="middle">Bolt + agent core</text>
          </g>

          <g>
            <rect x="720" y="26" width="158" height="64" rx="12" class="arch__node" />
            <text x="799" y="54" class="arch__node-title" text-anchor="middle">Gemini</text>
            <text x="799" y="72" class="arch__node-sub" text-anchor="middle">provider-agnostic</text>
          </g>

          <g>
            <rect x="720" y="176" width="158" height="96" rx="12" class="arch__node arch__node--db" />
            <text x="799" y="204" class="arch__node-title" text-anchor="middle">CockroachDB</text>
            <text x="799" y="224" class="arch__node-sub" text-anchor="middle">vector indexes +</text>
            <text x="799" y="240" class="arch__node-sub" text-anchor="middle">transactional tables</text>
            <text x="799" y="258" class="arch__node-sub" text-anchor="middle">keyed by workspace_id</text>
          </g>

          <g>
            <rect x="22" y="300" width="150" height="64" rx="12" class="arch__node" />
            <text x="97" y="328" class="arch__node-title" text-anchor="middle">EventBridge</text>
            <text x="97" y="346" class="arch__node-sub" text-anchor="middle">two crons</text>
          </g>

          <g>
            <rect x="240" y="300" width="162" height="64" rx="12" class="arch__node" />
            <text x="321" y="328" class="arch__node-title" text-anchor="middle">Lambda</text>
            <text x="321" y="346" class="arch__node-sub" text-anchor="middle">summary + deadlines</text>
          </g>
        </svg>
      </div>

      <p class="arch__caption">
        One database does both jobs: CockroachDB holds the
        <span class="code-pill">VECTOR(768)</span> cosine indexes for semantic
        search and the transactional tables for decisions, todos, and messages
        — side by side. Every table and every vector index is keyed by
        <span class="code-pill">workspace_id</span>, so similarity search is
        tenant-isolated at the index level.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts"></script>

<style scoped>
.arch__diagram-wrap {
  margin-top: 2.5rem;
  padding: 1rem;
  overflow-x: auto;
}

.arch__svg {
  display: block;
  width: 100%;
  min-width: 46rem;
  height: auto;
}

.arch__node {
  fill: var(--surface-muted);
  stroke: var(--border-default);
  stroke-width: 1.5;
}

.arch__node--db {
  stroke: var(--color-primary);
  stroke-width: 2;
}

.arch__node-title {
  fill: var(--text-primary);
  font-size: 15px;
  font-weight: 700;
  font-family: var(--font-family);
}

.arch__node-sub {
  fill: var(--text-muted);
  font-size: 11px;
  font-family: var(--font-family);
}

.arch__edge {
  stroke: var(--text-muted);
  stroke-width: 1.5;
}

.arch__edge-label {
  fill: var(--text-muted);
  font-size: 11px;
  font-family: var(--font-family);
}

.arch__arrow-head {
  fill: var(--text-muted);
}

.arch__caption {
  margin-top: 1.5rem;
  max-width: 46rem;
  font-size: 0.925rem;
  line-height: 1.7;
  color: var(--text-secondary);
}
</style>
