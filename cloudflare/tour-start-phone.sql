-- Additive migration. Apply once after an encrypted backup and isolated restore test.
ALTER TABLE tours ADD COLUMN start_phone TEXT CHECK(start_phone IS NULL OR start_phone IN ('black','red','purple'));
CREATE TRIGGER tour_start_phone_guard BEFORE UPDATE OF start_phone ON tours
WHEN NEW.start_phone IS NOT OLD.start_phone AND
 (OLD.start_id IS NOT NULL OR OLD.status!='open' OR NEW.status!='running' OR NEW.start_id IS NULL OR EXISTS(SELECT 1 FROM self_delivery_tours WHERE tour_id=OLD.id))
BEGIN SELECT RAISE(ABORT,'immutable tour start phone'); END;
