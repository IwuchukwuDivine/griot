-- Memory lifecycle: provenance on bot answers + decision supersession.

-- Provenance: which memories a bot answer was built from (NULL for human
-- messages and replies that used no retrieval).
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sources JSONB NULL;

-- Supersession: a new decision records which memory the Conflict Guard said
-- it contradicts; confirming "replace the old rule" retires the old row.
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS conflicts_with_decision UUID NULL;
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS conflicts_with_knowledge UUID NULL;
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS superseded_by UUID NULL;
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS superseded_at TIMESTAMPTZ NULL;

ALTER TABLE knowledge ADD COLUMN IF NOT EXISTS superseded_at TIMESTAMPTZ NULL;
