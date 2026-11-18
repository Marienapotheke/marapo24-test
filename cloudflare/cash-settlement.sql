CREATE TABLE IF NOT EXISTS cash_settlements (
 tour_id TEXT PRIMARY KEY,driver_id TEXT NOT NULL,completion_id TEXT NOT NULL,
 fingerprint TEXT NOT NULL,collected_cents INTEGER NOT NULL CHECK(collected_cents>=0),
 retention_at TEXT NOT NULL,data TEXT NOT NULL CHECK(json_valid(data))
);
CREATE TRIGGER IF NOT EXISTS cash_settlement_insert_guard BEFORE INSERT ON cash_settlements BEGIN
 SELECT CASE WHEN NOT EXISTS (
 SELECT 1 FROM tours t JOIN users u ON u.uid=NEW.driver_id
 WHERE t.id=NEW.tour_id AND t.status='finished' AND t.driver_id=u.uid AND u.active=1
 AND EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='driver')
 AND NEW.retention_at=t.created_at
 AND NOT EXISTS(SELECT 1 FROM stops WHERE tour_id=t.id AND status='offen')
 AND NEW.collected_cents=(SELECT coalesce(sum(coalesce(json_extract(p.data,'$.collectedCents'),json_extract(p.data,'$.cents'))),0) FROM proofs p WHERE p.tour_id=t.id AND json_extract(p.data,'$.status')='zugestellt' AND json_extract(p.data,'$.origin')='Marienapotheke')
 ) THEN RAISE(ABORT,'cash settlement authorization or amount') END;
END;
CREATE TRIGGER IF NOT EXISTS cash_settlement_immutable_update BEFORE UPDATE ON cash_settlements BEGIN SELECT RAISE(ABORT,'immutable cash settlement'); END;
CREATE TRIGGER IF NOT EXISTS cash_settlement_immutable_delete BEFORE DELETE ON cash_settlements BEGIN SELECT RAISE(ABORT,'immutable cash settlement'); END;
