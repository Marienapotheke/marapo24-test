-- Additive preparation only; apply separately after approval and tested encrypted backup.
CREATE TABLE tour_odometer_corrections (
 id TEXT PRIMARY KEY,
 tour_id TEXT NOT NULL,
 actor_uid TEXT NOT NULL REFERENCES users(uid),
 actor_name TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('start','end')),
 revision INTEGER NOT NULL CHECK(revision>0),
 previous_km INTEGER NOT NULL CHECK(previous_km BETWEEN 0 AND 9999999),
 corrected_km INTEGER NOT NULL CHECK(corrected_km BETWEEN 0 AND 9999999 AND corrected_km!=previous_km),
 reason TEXT NOT NULL CHECK(length(trim(reason)) BETWEEN 3 AND 240),
 fingerprint TEXT NOT NULL,
 captured_at TEXT NOT NULL,
 created_at TEXT NOT NULL,
 retention_at TEXT NOT NULL,
 UNIQUE(tour_id,revision)
);
CREATE TRIGGER odometer_insert_guard BEFORE INSERT ON tour_odometer_corrections BEGIN
 SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM tours t JOIN users u ON u.uid=NEW.actor_uid
  WHERE t.id=NEW.tour_id AND t.driver_id=u.uid AND u.active=1
  AND EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='driver')
  AND NOT EXISTS(SELECT 1 FROM self_delivery_tours WHERE tour_id=t.id)
  AND NOT EXISTS(SELECT 1 FROM cash_settlements WHERE tour_id=t.id)
  AND NEW.retention_at=t.created_at
  AND NEW.revision=1+COALESCE((SELECT max(revision) FROM tour_odometer_corrections WHERE tour_id=t.id),0)
  AND ((NEW.kind='start' AND t.status='running' AND t.start_id IS NOT NULL
    AND NEW.previous_km=COALESCE((SELECT corrected_km FROM tour_odometer_corrections WHERE tour_id=t.id AND kind='start' ORDER BY revision DESC LIMIT 1),t.start_odometer))
   OR (NEW.kind='end' AND t.status='finished' AND t.end_id IS NOT NULL
    AND NEW.previous_km=COALESCE((SELECT corrected_km FROM tour_odometer_corrections WHERE tour_id=t.id AND kind='end' ORDER BY revision DESC LIMIT 1),t.end_odometer)
    AND NEW.corrected_km>=COALESCE((SELECT corrected_km FROM tour_odometer_corrections WHERE tour_id=t.id AND kind='start' ORDER BY revision DESC LIMIT 1),t.start_odometer,0)))
 ) THEN RAISE(ABORT,'odometer authorization, revision or state') END;
END;
CREATE TRIGGER odometer_immutable_update BEFORE UPDATE ON tour_odometer_corrections BEGIN SELECT RAISE(ABORT,'immutable odometer correction'); END;
CREATE TRIGGER odometer_immutable_delete BEFORE DELETE ON tour_odometer_corrections BEGIN SELECT RAISE(ABORT,'immutable odometer correction'); END;
CREATE TRIGGER activity_odometer_insert AFTER INSERT ON tour_odometer_corrections BEGIN INSERT INTO tour_activity_versions VALUES(NEW.tour_id,1) ON CONFLICT(tour_id) DO UPDATE SET revision=revision+1; END;
CREATE TRIGGER tour_finish_odometer_guard BEFORE UPDATE OF status,end_odometer ON tours
WHEN OLD.status='running' AND NEW.status='finished' AND NEW.end_odometer IS NOT NULL
 AND NOT EXISTS(SELECT 1 FROM self_delivery_tours WHERE tour_id=OLD.id)
 AND NEW.end_odometer<COALESCE((SELECT corrected_km FROM tour_odometer_corrections WHERE tour_id=OLD.id AND kind='start' ORDER BY revision DESC LIMIT 1),NEW.start_odometer,0)
BEGIN SELECT RAISE(ABORT,'end odometer below corrected start'); END;
