/* Preparation only; only an untouched, unstarted tour may lose prepared children. */
CREATE TRIGGER IF NOT EXISTS clear_unstarted_tour BEFORE DELETE ON tours
WHEN OLD.status='open' AND OLD.started_at IS NULL AND OLD.start_id IS NULL
 AND NOT EXISTS(SELECT 1 FROM proofs WHERE tour_id=OLD.id)
 AND NOT EXISTS(SELECT 1 FROM cash_settlements WHERE tour_id=OLD.id)
BEGIN
 DELETE FROM tour_orders WHERE tour_id=OLD.id;
 DELETE FROM stops WHERE tour_id=OLD.id AND proof_id IS NULL AND status='offen';
END;
