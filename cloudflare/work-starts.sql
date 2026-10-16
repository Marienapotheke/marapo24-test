/* Preparation only. No live migration without release approval and a fresh tested backup. */
CREATE TABLE IF NOT EXISTS work_starts (
 uid TEXT NOT NULL REFERENCES users(uid), day TEXT NOT NULL,
 started_at TEXT NOT NULL, captured_at TEXT NOT NULL,
 completion_id TEXT NOT NULL, PRIMARY KEY(uid,day)
);
CREATE TRIGGER IF NOT EXISTS work_start_immutable_update BEFORE UPDATE ON work_starts BEGIN SELECT RAISE(ABORT,'immutable work start'); END;
