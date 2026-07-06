<template>
  <section id="usage" class="section">
    <div class="container-site">
      <span class="section-kicker">How to use it</span>
      <h2 class="section-title">No slash commands. No syntax. Just talk.</h2>
      <p class="section-lead">
        Mention <span class="code-pill">@Griot</span> and say what you mean —
        an intent classifier routes every message to the right memory.
      </p>

      <div class="usage__table-wrap">
        <table class="usage__table">
          <thead>
            <tr>
              <th scope="col">You say</th>
              <th scope="col">Griot does</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in USAGE_EXAMPLES" :key="row.label">
              <td>
                <span class="usage__label">{{ row.label }}</span>
                <span class="code-pill usage__you">{{ row.you }}</span>
              </td>
              <td class="usage__griot">{{ row.griot }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="usage__jobs">
        <div v-for="job in AUTOMATIC_JOBS" :key="job.title" class="card">
          <div class="usage__job-head">
            <Clock :size="18" class="usage__job-icon" />
            <h3 class="usage__job-title">{{ job.title }}</h3>
          </div>
          <p class="usage__job-detail">{{ job.detail }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Clock } from "lucide-vue-next";
import { AUTOMATIC_JOBS, USAGE_EXAMPLES } from "~/utils/constants/siteData";
</script>

<style scoped>
.usage__table-wrap {
  margin-top: 2.5rem;
  overflow-x: auto;
  border: 1px solid var(--border-default);
  border-radius: 1rem;
  background: var(--surface-elevated);
}

.usage__table {
  width: 100%;
  min-width: 40rem;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.usage__table th {
  text-align: left;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid var(--border-default);
}

.usage__table td {
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid var(--border-light);
  vertical-align: top;
}

.usage__table tbody tr:last-child td {
  border-bottom: none;
}

.usage__label {
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 0.3rem;
}

.usage__you {
  white-space: normal;
}

.usage__griot {
  color: var(--text-secondary);
  line-height: 1.55;
}

.usage__jobs {
  display: grid;
  gap: 1.25rem;
  margin-top: 1.5rem;
}

@media (min-width: 768px) {
  .usage__jobs {
    grid-template-columns: repeat(2, 1fr);
  }
}

.usage__job-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

.usage__job-icon {
  color: var(--color-primary);
}

.usage__job-title {
  font-weight: 700;
  font-size: 0.95rem;
}

.usage__job-detail {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text-secondary);
}
</style>
