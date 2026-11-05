/* Preparation only: append corrections, never update archived proof/signature bytes. */
CREATE TABLE IF NOT EXISTS delivery_amendments (
 id TEXT PRIMARY KEY, tour_id TEXT NOT NULL, stop_id TEXT NOT NULL, proof_id TEXT,
 actor_uid TEXT NOT NULL, revision INTEGER NOT NULL, kind TEXT NOT NULL CHECK(kind IN('money','reopen')),
 data TEXT NOT NULL CHECK(json_valid(data)), fingerprint TEXT NOT NULL,
 created_at TEXT NOT NULL, retention_at TEXT NOT NULL, UNIQUE(stop_id,revision)
);
CREATE INDEX IF NOT EXISTS amendments_proof ON delivery_amendments(proof_id,revision);
CREATE INDEX IF NOT EXISTS amendments_tour ON delivery_amendments(tour_id);
CREATE TRIGGER IF NOT EXISTS amendment_immutable_update BEFORE UPDATE ON delivery_amendments BEGIN SELECT RAISE(ABORT,'immutable amendment'); END;
CREATE TRIGGER IF NOT EXISTS amendment_immutable_delete BEFORE DELETE ON delivery_amendments BEGIN SELECT RAISE(ABORT,'immutable amendment'); END;
CREATE TRIGGER IF NOT EXISTS amendment_insert_guard BEFORE INSERT ON delivery_amendments BEGIN
 SELECT CASE WHEN NOT EXISTS (
 SELECT 1 FROM stops s JOIN tours t ON t.id=s.tour_id JOIN users u ON u.uid=NEW.actor_uid
 WHERE s.id=NEW.stop_id AND t.id=NEW.tour_id AND t.driver_id=u.uid AND u.active=1
 AND (EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='driver') OR EXISTS(SELECT 1 FROM self_delivery_tours m WHERE m.tour_id=t.id AND m.office_uid=u.uid AND EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='office')))
 AND NOT EXISTS(SELECT 1 FROM cash_settlements c WHERE c.tour_id=t.id)
 AND NOT EXISTS(SELECT 1 FROM delivery_amendments a WHERE a.stop_id=s.id AND a.kind='reopen')
 AND NEW.proof_id IS s.proof_id
 AND NEW.revision=1+COALESCE((SELECT max(revision) FROM delivery_amendments a WHERE a.stop_id=s.id),0)
 AND NEW.revision<=100
 AND length(trim(json_extract(NEW.data,'$.reason'))) BETWEEN 3 AND 240
 AND ((NEW.kind='reopen' AND s.proof_id IS NOT NULL AND t.status='running' AND json_extract(NEW.data,'$.replacementId') IS NOT NULL AND json_extract(NEW.data,'$.cashCleared')=1)
 OR (NEW.kind='money' AND (t.status='running' OR (t.status='finished' AND s.proof_id IS NOT NULL))
 AND json_type(NEW.data,'$.cents')='integer' AND json_extract(NEW.data,'$.cents') BETWEEN 0 AND 999999
 AND json_type(NEW.data,'$.collectedCents')='integer' AND json_extract(NEW.data,'$.collectedCents') BETWEEN 0 AND json_extract(NEW.data,'$.cents')
 AND (s.status='zugestellt' OR json_extract(NEW.data,'$.collectedCents')=0)
 AND (json_extract(s.data,'$.type') NOT IN('pflege','partner') OR json_extract(NEW.data,'$.cents')=0)))
 ) THEN RAISE(ABORT,'amendment authorization or state') END;
END;
CREATE TRIGGER IF NOT EXISTS amendment_apply AFTER INSERT ON delivery_amendments BEGIN
 UPDATE stops SET data=json_set(data,'$.cents',json_extract(NEW.data,'$.cents'),'$._editVersion',COALESCE(json_extract(data,'$._editVersion'),0)+1) WHERE id=NEW.stop_id AND proof_id IS NULL AND NEW.kind='money';
 INSERT INTO stops(id,tour_id,data,status,created_at) SELECT json_extract(NEW.data,'$.replacementId'),s.tour_id,json_set(s.data,'$.cents',json_extract(NEW.data,'$.cents'),'$._editVersion',0),'offen',s.created_at FROM stops s WHERE s.id=NEW.stop_id AND NEW.kind='reopen';
 INSERT INTO tour_orders(tour_id,stop_ids,revision,updated_at) SELECT NEW.tour_id,COALESCE((SELECT json_group_array(id) FROM (SELECT id FROM stops WHERE tour_id=NEW.tour_id AND status='offen' ORDER BY created_at,id)),'[]'),1,NEW.created_at WHERE NEW.kind='reopen'
 ON CONFLICT(tour_id) DO UPDATE SET stop_ids=json_insert(tour_orders.stop_ids,'$[#]',json_extract(NEW.data,'$.replacementId')),revision=tour_orders.revision+1,updated_at=NEW.created_at;
END;
CREATE VIEW IF NOT EXISTS effective_proof_payments AS
 SELECT p.*,COALESCE(json_extract((SELECT a.data FROM delivery_amendments a WHERE a.proof_id=p.id AND a.kind='money' ORDER BY a.revision DESC LIMIT 1),'$.collectedCents'),json_extract(p.data,'$.collectedCents'),json_extract(p.data,'$.cents')) AS effective_collected_cents
 FROM proofs p WHERE NOT EXISTS(SELECT 1 FROM delivery_amendments a WHERE a.proof_id=p.id AND a.kind='reopen');
DROP TRIGGER IF EXISTS proof_insert_guard;
CREATE TRIGGER proof_insert_guard BEFORE INSERT ON proofs BEGIN
 SELECT CASE WHEN NOT EXISTS (
 SELECT 1 FROM users u JOIN tours t ON t.id=NEW.tour_id JOIN stops s ON s.id=NEW.stop_id AND s.tour_id=t.id
 WHERE u.uid=NEW.driver_id AND u.active=1 AND t.driver_id=u.uid AND t.status='running' AND s.status='offen'
 AND (EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='driver') OR (EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='office') AND EXISTS(SELECT 1 FROM self_delivery_tours m WHERE m.tour_id=t.id AND m.office_uid=u.uid)))
 AND json_extract(NEW.data,'$.cents') IS CASE WHEN json_extract(s.data,'$.cashExempt')=1 THEN 0 ELSE json_extract(s.data,'$.cents') END
 ) THEN RAISE(ABORT,'proof authorization, amount or state') END;
END;
DROP TRIGGER IF EXISTS cash_settlement_insert_guard;
CREATE TRIGGER cash_settlement_insert_guard BEFORE INSERT ON cash_settlements BEGIN
 SELECT CASE WHEN NOT EXISTS (
 SELECT 1 FROM tours t JOIN users actor ON actor.uid=COALESCE(json_extract(NEW.data,'$.settledByUid'),NEW.driver_id)
 WHERE t.id=NEW.tour_id AND t.status='finished' AND t.driver_id=NEW.driver_id AND actor.active=1
 AND ((actor.uid=t.driver_id AND EXISTS(SELECT 1 FROM json_each(actor.roles) WHERE value='driver')) OR EXISTS(SELECT 1 FROM json_each(actor.roles) WHERE value='office'))
 AND NEW.retention_at=t.created_at AND NOT EXISTS(SELECT 1 FROM stops WHERE tour_id=t.id AND status='offen')
 AND NEW.collected_cents=(SELECT coalesce(sum(p.effective_collected_cents),0) FROM effective_proof_payments p WHERE p.tour_id=t.id AND json_extract(p.data,'$.status')='zugestellt' AND json_extract(p.data,'$.origin')='Marienapotheke')
 ) THEN RAISE(ABORT,'cash settlement authorization or amount') END;
END;
