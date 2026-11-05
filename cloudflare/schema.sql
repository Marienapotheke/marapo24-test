PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
 uid TEXT PRIMARY KEY, display_name TEXT NOT NULL, roles TEXT NOT NULL CHECK(json_valid(roles)),
 active INTEGER NOT NULL CHECK(active IN (0,1)), is_admin INTEGER NOT NULL DEFAULT 0 CHECK(is_admin IN (0,1)),
 can_special INTEGER NOT NULL DEFAULT 0 CHECK(can_special IN (0,1))
);
CREATE TABLE IF NOT EXISTS vehicles (id TEXT PRIMARY KEY,label TEXT NOT NULL,active INTEGER NOT NULL CHECK(active IN (0,1)),created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tours (
 id TEXT PRIMARY KEY,date TEXT NOT NULL,type TEXT NOT NULL,regular_type TEXT,driver_id TEXT,
 created_by TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('open','running','finished')),created_at TEXT NOT NULL,
 vehicle_id TEXT,vehicle_label TEXT,started_at TEXT,ended_at TEXT,start_captured TEXT,end_captured TEXT,
 start_id TEXT,start_hash TEXT,end_id TEXT,end_hash TEXT,UNIQUE(date,regular_type)
);
CREATE INDEX IF NOT EXISTS tours_driver_date ON tours(driver_id,date);
CREATE INDEX IF NOT EXISTS tours_date ON tours(date);
CREATE TABLE IF NOT EXISTS stops (
 id TEXT PRIMARY KEY,tour_id TEXT NOT NULL REFERENCES tours(id),data TEXT NOT NULL CHECK(json_valid(data)),
 status TEXT NOT NULL CHECK(status IN ('offen','zugestellt','nicht zugestellt')),created_at TEXT NOT NULL,
 proof_id TEXT,completed_at TEXT
);
CREATE INDEX IF NOT EXISTS stops_tour_status ON stops(tour_id,status);
CREATE TABLE IF NOT EXISTS proofs (
 id TEXT PRIMARY KEY,tour_id TEXT NOT NULL REFERENCES tours(id),stop_id TEXT NOT NULL UNIQUE REFERENCES stops(id),
 driver_id TEXT NOT NULL,completion_id TEXT NOT NULL,fingerprint TEXT NOT NULL,data TEXT NOT NULL CHECK(json_valid(data))
);
CREATE INDEX IF NOT EXISTS proofs_tour ON proofs(tour_id);
CREATE TRIGGER IF NOT EXISTS proof_insert_guard BEFORE INSERT ON proofs BEGIN
 SELECT CASE WHEN NOT EXISTS (
 SELECT 1 FROM users u JOIN tours t ON t.id=NEW.tour_id JOIN stops s ON s.id=NEW.stop_id AND s.tour_id=t.id
 WHERE u.uid=NEW.driver_id AND u.active=1 AND EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='driver')
 AND t.driver_id=u.uid AND t.status='running' AND s.status='offen') THEN RAISE(ABORT,'proof authorization or state') END;
END;
CREATE TRIGGER IF NOT EXISTS proof_apply AFTER INSERT ON proofs BEGIN
 UPDATE stops SET status=json_extract(NEW.data,'$.status'),proof_id=NEW.id,completed_at=json_extract(NEW.data,'$.completedAt') WHERE id=NEW.stop_id;
END;
CREATE TRIGGER IF NOT EXISTS proof_immutable_update BEFORE UPDATE ON proofs BEGIN SELECT RAISE(ABORT,'immutable proof'); END;
CREATE TRIGGER IF NOT EXISTS proof_immutable_delete BEFORE DELETE ON proofs BEGIN SELECT RAISE(ABORT,'immutable proof'); END;
