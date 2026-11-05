/* Preparation only. Accepted assignment changes are append-only and never rewrite proofs. */
CREATE TABLE IF NOT EXISTS tour_activity_versions(tour_id TEXT PRIMARY KEY REFERENCES tours(id) ON DELETE CASCADE,revision INTEGER NOT NULL DEFAULT 0);
CREATE TRIGGER IF NOT EXISTS activity_stop_insert AFTER INSERT ON stops BEGIN INSERT INTO tour_activity_versions VALUES(NEW.tour_id,1) ON CONFLICT(tour_id) DO UPDATE SET revision=revision+1; END;
CREATE TRIGGER IF NOT EXISTS activity_stop_update AFTER UPDATE ON stops BEGIN INSERT INTO tour_activity_versions VALUES(NEW.tour_id,1) ON CONFLICT(tour_id) DO UPDATE SET revision=revision+1; END;
CREATE TRIGGER IF NOT EXISTS activity_stop_delete AFTER DELETE ON stops BEGIN INSERT INTO tour_activity_versions VALUES(OLD.tour_id,1) ON CONFLICT(tour_id) DO UPDATE SET revision=revision+1; END;
CREATE TRIGGER IF NOT EXISTS activity_tour_update AFTER UPDATE OF status,vehicle_id,start_odometer,end_odometer ON tours BEGIN INSERT INTO tour_activity_versions VALUES(NEW.id,1) ON CONFLICT(tour_id) DO UPDATE SET revision=revision+1; END;
CREATE TRIGGER IF NOT EXISTS activity_order_insert AFTER INSERT ON tour_orders BEGIN INSERT INTO tour_activity_versions VALUES(NEW.tour_id,1) ON CONFLICT(tour_id) DO UPDATE SET revision=revision+1; END;
CREATE TRIGGER IF NOT EXISTS activity_order_update AFTER UPDATE ON tour_orders BEGIN INSERT INTO tour_activity_versions VALUES(NEW.tour_id,1) ON CONFLICT(tour_id) DO UPDATE SET revision=revision+1; END;
CREATE TRIGGER IF NOT EXISTS activity_amendment_insert AFTER INSERT ON delivery_amendments BEGIN INSERT INTO tour_activity_versions VALUES(NEW.tour_id,1) ON CONFLICT(tour_id) DO UPDATE SET revision=revision+1; END;
CREATE TABLE IF NOT EXISTS tour_handover_offers (
 id TEXT PRIMARY KEY,tour_id TEXT NOT NULL,from_uid TEXT NOT NULL,to_uid TEXT NOT NULL,
 activity_revision INTEGER NOT NULL,created_at TEXT NOT NULL,expires_at TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN('pending','accepted','cancelled')),fingerprint TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS handover_recipient ON tour_handover_offers(to_uid,status);
CREATE TABLE IF NOT EXISTS tour_assignments (
 id TEXT PRIMARY KEY,tour_id TEXT NOT NULL,from_uid TEXT,to_uid TEXT NOT NULL,
 actor_uid TEXT NOT NULL,kind TEXT NOT NULL CHECK(kind IN('direct','confirmed')),
 offer_id TEXT,data TEXT NOT NULL CHECK(json_valid(data)),fingerprint TEXT NOT NULL,
 created_at TEXT NOT NULL,retention_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS assignments_tour ON tour_assignments(tour_id);
CREATE TRIGGER IF NOT EXISTS assignment_immutable_update BEFORE UPDATE ON tour_assignments BEGIN SELECT RAISE(ABORT,'immutable assignment'); END;
CREATE TRIGGER IF NOT EXISTS assignment_immutable_delete BEFORE DELETE ON tour_assignments BEGIN SELECT RAISE(ABORT,'immutable assignment'); END;
CREATE TRIGGER IF NOT EXISTS handover_offer_guard BEFORE INSERT ON tour_handover_offers BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM tours t JOIN users u ON u.uid=NEW.from_uid JOIN users target ON target.uid=NEW.to_uid
 WHERE t.id=NEW.tour_id AND t.driver_id=u.uid AND t.status='running' AND u.active=1 AND target.active=1 AND u.uid!=target.uid
 AND EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='driver') AND EXISTS(SELECT 1 FROM json_each(target.roles) WHERE value='driver')
 AND NOT EXISTS(SELECT 1 FROM self_delivery_tours WHERE tour_id=t.id)
 AND NEW.activity_revision=COALESCE((SELECT revision FROM tour_activity_versions WHERE tour_id=t.id),0)
 AND NOT EXISTS(SELECT 1 FROM cash_settlements WHERE tour_id=t.id)) THEN RAISE(ABORT,'handover offer authorization or state') END;
END;
CREATE TRIGGER IF NOT EXISTS handover_offer_supersede AFTER INSERT ON tour_handover_offers BEGIN UPDATE tour_handover_offers SET status='cancelled' WHERE tour_id=NEW.tour_id AND id!=NEW.id AND status='pending'; END;
CREATE TRIGGER IF NOT EXISTS assignment_insert_guard BEFORE INSERT ON tour_assignments BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM tours t JOIN users actor ON actor.uid=NEW.actor_uid JOIN users target ON target.uid=NEW.to_uid
 WHERE t.id=NEW.tour_id AND t.driver_id IS NEW.from_uid AND actor.uid=target.uid AND actor.active=1 AND target.active=1
 AND EXISTS(SELECT 1 FROM json_each(actor.roles) WHERE value='driver')
 AND NOT EXISTS(SELECT 1 FROM self_delivery_tours WHERE tour_id=t.id) AND NOT EXISTS(SELECT 1 FROM cash_settlements WHERE tour_id=t.id)
 AND NEW.retention_at=t.created_at
 AND ((NEW.kind='direct' AND t.status='open' AND t.started_at IS NULL AND t.start_id IS NULL AND NOT EXISTS(SELECT 1 FROM proofs WHERE tour_id=t.id))
 OR (NEW.kind='confirmed' AND t.status='running' AND EXISTS(SELECT 1 FROM tour_handover_offers o JOIN users previous ON previous.uid=o.from_uid WHERE o.id=NEW.offer_id AND o.tour_id=t.id AND o.from_uid=t.driver_id AND o.to_uid=NEW.to_uid AND o.status='pending' AND previous.active=1 AND EXISTS(SELECT 1 FROM json_each(previous.roles) WHERE value='driver') AND o.expires_at>strftime('%Y-%m-%dT%H:%M:%fZ','now') AND o.activity_revision=COALESCE((SELECT revision FROM tour_activity_versions WHERE tour_id=t.id),0))))
 ) THEN RAISE(ABORT,'assignment authorization or state') END;
END;
CREATE TRIGGER IF NOT EXISTS assignment_apply AFTER INSERT ON tour_assignments BEGIN
 UPDATE tours SET driver_id=NEW.to_uid WHERE id=NEW.tour_id;
 INSERT INTO tour_activity_versions VALUES(NEW.tour_id,1) ON CONFLICT(tour_id) DO UPDATE SET revision=revision+1;
 UPDATE tour_handover_offers SET status=CASE WHEN id=NEW.offer_id THEN 'accepted' ELSE 'cancelled' END WHERE tour_id=NEW.tour_id AND status='pending';
END;
