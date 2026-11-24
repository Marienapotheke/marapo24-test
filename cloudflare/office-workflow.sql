/* PREPARATION ONLY. Apply separately after operator approval and a fresh tested backup.
   Existing immutable update/delete guards and archive data remain untouched. */
CREATE TABLE IF NOT EXISTS self_delivery_tours (
 tour_id TEXT PRIMARY KEY REFERENCES tours(id) ON DELETE CASCADE,
 office_uid TEXT NOT NULL REFERENCES users(uid)
);
DROP TRIGGER IF EXISTS proof_insert_guard;
CREATE TRIGGER proof_insert_guard BEFORE INSERT ON proofs BEGIN
 SELECT CASE WHEN NOT EXISTS (
 SELECT 1 FROM users u JOIN tours t ON t.id=NEW.tour_id JOIN stops s ON s.id=NEW.stop_id AND s.tour_id=t.id
 WHERE u.uid=NEW.driver_id AND u.active=1 AND t.driver_id=u.uid AND t.status='running' AND s.status='offen'
 AND (EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='driver') OR
 (EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='office') AND EXISTS(SELECT 1 FROM self_delivery_tours m WHERE m.tour_id=t.id AND m.office_uid=u.uid)))
 ) THEN RAISE(ABORT,'proof authorization or state') END;
END;
DROP TRIGGER IF EXISTS cash_settlement_insert_guard;
CREATE TRIGGER cash_settlement_insert_guard BEFORE INSERT ON cash_settlements BEGIN
 SELECT CASE WHEN NOT EXISTS (
 SELECT 1 FROM tours t JOIN users actor ON actor.uid=COALESCE(json_extract(NEW.data,'$.settledByUid'),NEW.driver_id)
 WHERE t.id=NEW.tour_id AND t.status='finished' AND t.driver_id=NEW.driver_id AND actor.active=1
 AND ((actor.uid=t.driver_id AND EXISTS(SELECT 1 FROM json_each(actor.roles) WHERE value='driver')) OR EXISTS(SELECT 1 FROM json_each(actor.roles) WHERE value='office'))
 AND NEW.retention_at=t.created_at
 AND NOT EXISTS(SELECT 1 FROM stops WHERE tour_id=t.id AND status='offen')
 AND NEW.collected_cents=(SELECT coalesce(sum(coalesce(json_extract(p.data,'$.collectedCents'),json_extract(p.data,'$.cents'))),0) FROM proofs p WHERE p.tour_id=t.id AND json_extract(p.data,'$.status')='zugestellt' AND json_extract(p.data,'$.origin')='Marienapotheke')
 ) THEN RAISE(ABORT,'cash settlement authorization or amount') END;
END;
