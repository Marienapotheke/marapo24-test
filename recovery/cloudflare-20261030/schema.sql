PRAGMA foreign_keys = ON;
CREATE TABLE address_locations (
 id TEXT PRIMARY KEY,lat REAL NOT NULL,lon REAL NOT NULL,provider TEXT NOT NULL,updated_at TEXT NOT NULL
);
CREATE TABLE cash_settlements (
 tour_id TEXT PRIMARY KEY,driver_id TEXT NOT NULL,completion_id TEXT NOT NULL,
 fingerprint TEXT NOT NULL,collected_cents INTEGER NOT NULL CHECK(collected_cents>=0),
 retention_at TEXT NOT NULL,data TEXT NOT NULL CHECK(json_valid(data))
);
CREATE TABLE customers (
 id TEXT PRIMARY KEY,search_name TEXT NOT NULL,data TEXT NOT NULL CHECK(json_valid(data)),last_delivered_at TEXT NOT NULL
);
CREATE TABLE delivery_amendments (
 id TEXT PRIMARY KEY, tour_id TEXT NOT NULL, stop_id TEXT NOT NULL, proof_id TEXT,
 actor_uid TEXT NOT NULL, revision INTEGER NOT NULL, kind TEXT NOT NULL CHECK(kind IN('money','reopen')),
 data TEXT NOT NULL CHECK(json_valid(data)), fingerprint TEXT NOT NULL,
 created_at TEXT NOT NULL, retention_at TEXT NOT NULL, UNIQUE(stop_id,revision)
);
CREATE TABLE driver_devices (
 id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, label TEXT NOT NULL,
 active INTEGER NOT NULL CHECK(active IN(0,1)),created_at TEXT NOT NULL,expires_at INTEGER NOT NULL
);
CREATE TABLE driver_pin_attempts(uid TEXT PRIMARY KEY,window INTEGER NOT NULL,count INTEGER NOT NULL);
CREATE TABLE driver_pins (
 uid TEXT PRIMARY KEY REFERENCES users(uid),salt TEXT NOT NULL,pin_hash TEXT NOT NULL,
 active INTEGER NOT NULL CHECK(active IN(0,1))
);
CREATE TABLE driver_sessions (
 token_hash TEXT PRIMARY KEY,uid TEXT NOT NULL REFERENCES users(uid),device_id TEXT NOT NULL REFERENCES driver_devices(id),expires_at INTEGER NOT NULL
);
CREATE TABLE office_attempts(key TEXT PRIMARY KEY,window INTEGER NOT NULL,count INTEGER NOT NULL);
CREATE TABLE office_credentials_v2(uid TEXT PRIMARY KEY REFERENCES users(uid),username TEXT NOT NULL UNIQUE,salt TEXT NOT NULL,password_hash TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,must_change INTEGER NOT NULL DEFAULT 1);
CREATE TABLE office_sessions(token_hash TEXT PRIMARY KEY,uid TEXT NOT NULL REFERENCES users(uid),credential_hash TEXT NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE password_reset_requests(uid TEXT PRIMARY KEY REFERENCES users(uid),requested_at TEXT NOT NULL);
CREATE TABLE proofs (
 id TEXT PRIMARY KEY,tour_id TEXT NOT NULL REFERENCES tours(id),stop_id TEXT NOT NULL UNIQUE REFERENCES stops(id),
 driver_id TEXT NOT NULL,completion_id TEXT NOT NULL,fingerprint TEXT NOT NULL,data TEXT NOT NULL CHECK(json_valid(data))
);
CREATE TABLE routing_credit_events(id TEXT PRIMARY KEY,at INTEGER NOT NULL,credits INTEGER NOT NULL CHECK(credits>0));
CREATE TABLE routing_usage(day TEXT PRIMARY KEY,credits INTEGER NOT NULL);
CREATE TABLE self_delivery_tours (
 tour_id TEXT PRIMARY KEY REFERENCES tours(id) ON DELETE CASCADE,
 office_uid TEXT NOT NULL REFERENCES users(uid)
);
CREATE TABLE stops (
 id TEXT PRIMARY KEY,tour_id TEXT NOT NULL REFERENCES tours(id),data TEXT NOT NULL CHECK(json_valid(data)),
 status TEXT NOT NULL CHECK(status IN ('offen','zugestellt','nicht zugestellt')),created_at TEXT NOT NULL,
 proof_id TEXT,completed_at TEXT
);
CREATE TABLE tour_activity_versions(tour_id TEXT PRIMARY KEY REFERENCES tours(id) ON DELETE CASCADE,revision INTEGER NOT NULL DEFAULT 0);
CREATE TABLE tour_assignments (
 id TEXT PRIMARY KEY,tour_id TEXT NOT NULL,from_uid TEXT,to_uid TEXT NOT NULL,
 actor_uid TEXT NOT NULL,kind TEXT NOT NULL CHECK(kind IN('direct','confirmed')),
 offer_id TEXT,data TEXT NOT NULL CHECK(json_valid(data)),fingerprint TEXT NOT NULL,
 created_at TEXT NOT NULL,retention_at TEXT NOT NULL
);
CREATE TABLE tour_handover_offers (
 id TEXT PRIMARY KEY,tour_id TEXT NOT NULL,from_uid TEXT NOT NULL,to_uid TEXT NOT NULL,
 activity_revision INTEGER NOT NULL,created_at TEXT NOT NULL,expires_at TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN('pending','accepted','cancelled')),fingerprint TEXT NOT NULL
);
CREATE TABLE tour_orders (
 tour_id TEXT PRIMARY KEY REFERENCES tours(id),stop_ids TEXT NOT NULL CHECK(json_valid(stop_ids)),revision INTEGER NOT NULL,updated_at TEXT NOT NULL
);
CREATE TABLE tours (
 id TEXT PRIMARY KEY,date TEXT NOT NULL,type TEXT NOT NULL,regular_type TEXT,driver_id TEXT,
 created_by TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('open','running','finished')),created_at TEXT NOT NULL,
 vehicle_id TEXT,vehicle_label TEXT,started_at TEXT,ended_at TEXT,start_captured TEXT,end_captured TEXT,
 start_id TEXT,start_hash TEXT,end_id TEXT,end_hash TEXT, start_odometer INTEGER CHECK(start_odometer IS NULL OR start_odometer BETWEEN 0 AND 9999999), end_odometer INTEGER CHECK(end_odometer IS NULL OR end_odometer BETWEEN 0 AND 9999999), workflow_version INTEGER NOT NULL DEFAULT 1,UNIQUE(date,regular_type)
);
CREATE TABLE users (
 uid TEXT PRIMARY KEY, display_name TEXT NOT NULL, roles TEXT NOT NULL CHECK(json_valid(roles)),
 active INTEGER NOT NULL CHECK(active IN (0,1)), is_admin INTEGER NOT NULL DEFAULT 0 CHECK(is_admin IN (0,1)),
 can_special INTEGER NOT NULL DEFAULT 0 CHECK(can_special IN (0,1))
);
CREATE TABLE vehicles (id TEXT PRIMARY KEY,label TEXT NOT NULL,active INTEGER NOT NULL CHECK(active IN (0,1)),created_at TEXT NOT NULL);
CREATE TABLE work_starts (
 uid TEXT NOT NULL REFERENCES users(uid), day TEXT NOT NULL,
 started_at TEXT NOT NULL, captured_at TEXT NOT NULL,
 completion_id TEXT NOT NULL, PRIMARY KEY(uid,day)
);
CREATE VIEW current_proof_payments AS SELECT p.*,COALESCE(json_extract(s.data,'$.origin'),json_extract(p.data,'$.origin')) effective_origin FROM effective_proof_payments p JOIN stops s ON s.id=p.stop_id AND s.tour_id=p.tour_id;
CREATE VIEW effective_proof_payments AS
 SELECT p.*,COALESCE(json_extract((SELECT a.data FROM delivery_amendments a WHERE a.proof_id=p.id AND a.kind='money' ORDER BY a.revision DESC LIMIT 1),'$.collectedCents'),json_extract(p.data,'$.collectedCents'),json_extract(p.data,'$.cents')) AS effective_collected_cents
 FROM proofs p WHERE NOT EXISTS(SELECT 1 FROM delivery_amendments a WHERE a.proof_id=p.id AND a.kind='reopen');
CREATE INDEX amendments_proof ON delivery_amendments(proof_id,revision);
CREATE INDEX amendments_tour ON delivery_amendments(tour_id);
CREATE INDEX assignments_tour ON tour_assignments(tour_id);
CREATE INDEX customers_recent ON customers(last_delivered_at);
CREATE INDEX driver_sessions_device ON driver_sessions(device_id);
CREATE INDEX driver_sessions_uid ON driver_sessions(uid);
CREATE INDEX handover_recipient ON tour_handover_offers(to_uid,status);
CREATE INDEX office_session_user ON office_sessions(uid);
CREATE INDEX proofs_tour ON proofs(tour_id);
CREATE INDEX routing_credit_time ON routing_credit_events(at);
CREATE INDEX stops_tour_status ON stops(tour_id,status);
CREATE INDEX tours_date ON tours(date);
CREATE INDEX tours_driver_date ON tours(driver_id,date);
CREATE TRIGGER activity_amendment_insert AFTER INSERT ON delivery_amendments BEGIN INSERT INTO tour_activity_versions VALUES(NEW.tour_id,1) ON CONFLICT(tour_id) DO UPDATE SET revision=revision+1; END;
CREATE TRIGGER activity_order_insert AFTER INSERT ON tour_orders BEGIN INSERT INTO tour_activity_versions VALUES(NEW.tour_id,1) ON CONFLICT(tour_id) DO UPDATE SET revision=revision+1; END;
CREATE TRIGGER activity_order_update AFTER UPDATE ON tour_orders BEGIN INSERT INTO tour_activity_versions VALUES(NEW.tour_id,1) ON CONFLICT(tour_id) DO UPDATE SET revision=revision+1; END;
CREATE TRIGGER activity_stop_delete AFTER DELETE ON stops BEGIN INSERT INTO tour_activity_versions VALUES(OLD.tour_id,1) ON CONFLICT(tour_id) DO UPDATE SET revision=revision+1; END;
CREATE TRIGGER activity_stop_insert AFTER INSERT ON stops BEGIN INSERT INTO tour_activity_versions VALUES(NEW.tour_id,1) ON CONFLICT(tour_id) DO UPDATE SET revision=revision+1; END;
CREATE TRIGGER activity_stop_update AFTER UPDATE ON stops BEGIN INSERT INTO tour_activity_versions VALUES(NEW.tour_id,1) ON CONFLICT(tour_id) DO UPDATE SET revision=revision+1; END;
CREATE TRIGGER activity_tour_update AFTER UPDATE OF status,vehicle_id,start_odometer,end_odometer ON tours BEGIN INSERT INTO tour_activity_versions VALUES(NEW.id,1) ON CONFLICT(tour_id) DO UPDATE SET revision=revision+1; END;
CREATE TRIGGER amendment_apply AFTER INSERT ON delivery_amendments BEGIN
 UPDATE stops SET data=json_set(data,'$.cents',json_extract(NEW.data,'$.cents'),'$._editVersion',COALESCE(json_extract(data,'$._editVersion'),0)+1) WHERE id=NEW.stop_id AND proof_id IS NULL AND NEW.kind='money';
 INSERT INTO stops(id,tour_id,data,status,created_at) SELECT json_extract(NEW.data,'$.replacementId'),s.tour_id,json_set(s.data,'$.cents',json_extract(NEW.data,'$.cents'),'$._editVersion',0),'offen',s.created_at FROM stops s WHERE s.id=NEW.stop_id AND NEW.kind='reopen';
 INSERT INTO tour_orders(tour_id,stop_ids,revision,updated_at) SELECT NEW.tour_id,COALESCE((SELECT json_group_array(id) FROM (SELECT id FROM stops WHERE tour_id=NEW.tour_id AND status='offen' ORDER BY created_at,id)),'[]'),1,NEW.created_at WHERE NEW.kind='reopen'
 ON CONFLICT(tour_id) DO UPDATE SET stop_ids=json_insert(tour_orders.stop_ids,'$[#]',json_extract(NEW.data,'$.replacementId')),revision=tour_orders.revision+1,updated_at=NEW.created_at;
END;
CREATE TRIGGER amendment_immutable_delete BEFORE DELETE ON delivery_amendments BEGIN SELECT RAISE(ABORT,'immutable amendment'); END;
CREATE TRIGGER amendment_immutable_update BEFORE UPDATE ON delivery_amendments BEGIN SELECT RAISE(ABORT,'immutable amendment'); END;
CREATE TRIGGER amendment_insert_guard BEFORE INSERT ON delivery_amendments BEGIN
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
CREATE TRIGGER assignment_apply AFTER INSERT ON tour_assignments BEGIN
 UPDATE tours SET driver_id=NEW.to_uid WHERE id=NEW.tour_id;
 INSERT INTO tour_activity_versions VALUES(NEW.tour_id,1) ON CONFLICT(tour_id) DO UPDATE SET revision=revision+1;
 UPDATE tour_handover_offers SET status=CASE WHEN id=NEW.offer_id THEN 'accepted' ELSE 'cancelled' END WHERE tour_id=NEW.tour_id AND status='pending';
END;
CREATE TRIGGER assignment_immutable_delete BEFORE DELETE ON tour_assignments BEGIN SELECT RAISE(ABORT,'immutable assignment'); END;
CREATE TRIGGER assignment_immutable_update BEFORE UPDATE ON tour_assignments BEGIN SELECT RAISE(ABORT,'immutable assignment'); END;
CREATE TRIGGER assignment_insert_guard BEFORE INSERT ON tour_assignments BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM tours t JOIN users actor ON actor.uid=NEW.actor_uid JOIN users target ON target.uid=NEW.to_uid
 WHERE t.id=NEW.tour_id AND t.driver_id IS NEW.from_uid AND actor.uid=target.uid AND actor.active=1 AND target.active=1
 AND EXISTS(SELECT 1 FROM json_each(actor.roles) WHERE value='driver')
 AND NOT EXISTS(SELECT 1 FROM self_delivery_tours WHERE tour_id=t.id) AND NOT EXISTS(SELECT 1 FROM cash_settlements WHERE tour_id=t.id)
 AND NEW.retention_at=t.created_at
 AND ((NEW.kind='direct' AND t.status='open' AND t.started_at IS NULL AND t.start_id IS NULL AND NOT EXISTS(SELECT 1 FROM proofs WHERE tour_id=t.id))
 OR (NEW.kind='confirmed' AND t.status='running' AND EXISTS(SELECT 1 FROM tour_handover_offers o JOIN users previous ON previous.uid=o.from_uid WHERE o.id=NEW.offer_id AND o.tour_id=t.id AND o.from_uid=t.driver_id AND o.to_uid=NEW.to_uid AND o.status='pending' AND previous.active=1 AND EXISTS(SELECT 1 FROM json_each(previous.roles) WHERE value='driver') AND o.expires_at>strftime('%Y-%m-%dT%H:%M:%fZ','now') AND o.activity_revision=COALESCE((SELECT revision FROM tour_activity_versions WHERE tour_id=t.id),0))))
 ) THEN RAISE(ABORT,'assignment authorization or state') END;
END;
CREATE TRIGGER cash_settlement_immutable_delete BEFORE DELETE ON cash_settlements BEGIN SELECT RAISE(ABORT,'immutable cash settlement'); END;
CREATE TRIGGER cash_settlement_immutable_update BEFORE UPDATE ON cash_settlements BEGIN SELECT RAISE(ABORT,'immutable cash settlement'); END;
CREATE TRIGGER cash_settlement_insert_guard BEFORE INSERT ON cash_settlements BEGIN
 SELECT CASE WHEN NOT EXISTS (
 SELECT 1 FROM tours t JOIN users actor ON actor.uid=COALESCE(json_extract(NEW.data,'$.settledByUid'),NEW.driver_id)
 WHERE t.id=NEW.tour_id AND t.status='finished' AND t.driver_id=NEW.driver_id AND actor.active=1
 AND ((actor.uid=t.driver_id AND EXISTS(SELECT 1 FROM json_each(actor.roles) WHERE value='driver')) OR EXISTS(SELECT 1 FROM json_each(actor.roles) WHERE value='office'))
 AND NEW.retention_at=t.created_at AND NOT EXISTS(SELECT 1 FROM stops WHERE tour_id=t.id AND status='offen')
 AND NEW.collected_cents=(SELECT coalesce(sum(p.effective_collected_cents),0) FROM current_proof_payments p WHERE p.tour_id=t.id AND json_extract(p.data,'$.status')='zugestellt' AND p.effective_origin='Marienapotheke')
 ) THEN RAISE(ABORT,'cash settlement authorization or amount') END;
END;
CREATE TRIGGER clear_unstarted_tour BEFORE DELETE ON tours
WHEN OLD.status='open' AND OLD.started_at IS NULL AND OLD.start_id IS NULL
 AND NOT EXISTS(SELECT 1 FROM proofs WHERE tour_id=OLD.id)
 AND NOT EXISTS(SELECT 1 FROM cash_settlements WHERE tour_id=OLD.id)
BEGIN
 DELETE FROM tour_orders WHERE tour_id=OLD.id;
 DELETE FROM stops WHERE tour_id=OLD.id AND proof_id IS NULL AND status='offen';
END;
CREATE TRIGGER handover_offer_guard BEFORE INSERT ON tour_handover_offers BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM tours t JOIN users u ON u.uid=NEW.from_uid JOIN users target ON target.uid=NEW.to_uid
 WHERE t.id=NEW.tour_id AND t.driver_id=u.uid AND t.status='running' AND u.active=1 AND target.active=1 AND u.uid!=target.uid
 AND EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='driver') AND EXISTS(SELECT 1 FROM json_each(target.roles) WHERE value='driver')
 AND NOT EXISTS(SELECT 1 FROM self_delivery_tours WHERE tour_id=t.id)
 AND NEW.activity_revision=COALESCE((SELECT revision FROM tour_activity_versions WHERE tour_id=t.id),0)
 AND NOT EXISTS(SELECT 1 FROM cash_settlements WHERE tour_id=t.id)) THEN RAISE(ABORT,'handover offer authorization or state') END;
END;
CREATE TRIGGER handover_offer_supersede AFTER INSERT ON tour_handover_offers BEGIN UPDATE tour_handover_offers SET status='cancelled' WHERE tour_id=NEW.tour_id AND id!=NEW.id AND status='pending'; END;
CREATE TRIGGER proof_apply AFTER INSERT ON proofs BEGIN
 UPDATE stops SET status=json_extract(NEW.data,'$.status'),proof_id=NEW.id,completed_at=json_extract(NEW.data,'$.completedAt') WHERE id=NEW.stop_id;
END;
CREATE TRIGGER proof_immutable_delete BEFORE DELETE ON proofs BEGIN SELECT RAISE(ABORT,'immutable proof'); END;
CREATE TRIGGER proof_immutable_update BEFORE UPDATE ON proofs BEGIN SELECT RAISE(ABORT,'immutable proof'); END;
CREATE TRIGGER proof_insert_guard BEFORE INSERT ON proofs BEGIN
 SELECT CASE WHEN NOT EXISTS (
 SELECT 1 FROM users u JOIN tours t ON t.id=NEW.tour_id JOIN stops s ON s.id=NEW.stop_id AND s.tour_id=t.id
 WHERE u.uid=NEW.driver_id AND u.active=1 AND t.driver_id=u.uid AND t.status='running' AND s.status='offen'
 AND (EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='driver') OR (EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='office') AND EXISTS(SELECT 1 FROM self_delivery_tours m WHERE m.tour_id=t.id AND m.office_uid=u.uid)))
 AND COALESCE(json_extract(NEW.data,'$._editVersion'),0)=COALESCE(json_extract(s.data,'$._editVersion'),0)
 AND json_extract(NEW.data,'$.cents') IS CASE WHEN json_extract(s.data,'$.cashExempt')=1 THEN 0 ELSE json_extract(s.data,'$.cents') END
 ) THEN RAISE(ABORT,'proof authorization, amount or state') END;
END;
CREATE TRIGGER remember_delivered_customer AFTER INSERT ON proofs
WHEN json_extract(NEW.data,'$.status')='zugestellt' AND json_extract(NEW.data,'$.customerId') IS NOT NULL
BEGIN
 INSERT INTO customers(id,search_name,data,last_delivered_at)
 VALUES(json_extract(NEW.data,'$.customerId'),json_extract(NEW.data,'$.customerSearchName'),
 json_object('type',json_extract(NEW.data,'$.type'),'name',json_extract(NEW.data,'$.name'),'street',json_extract(NEW.data,'$.street'),'postalCode',json_extract(NEW.data,'$.postalCode'),'city',json_extract(NEW.data,'$.city'),'phone',json_extract(NEW.data,'$.phone')),
 json_extract(NEW.data,'$.completedAt'))
 ON CONFLICT(id) DO UPDATE SET search_name=excluded.search_name,data=excluded.data,last_delivered_at=excluded.last_delivered_at;
END;
CREATE TRIGGER work_start_immutable_update BEFORE UPDATE ON work_starts BEGIN SELECT RAISE(ABORT,'immutable work start'); END;
