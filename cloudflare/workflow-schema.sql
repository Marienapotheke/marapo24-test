/* Additive migration; existing tours retain version 1 for old offline captures. */
ALTER TABLE tours ADD COLUMN start_odometer INTEGER CHECK(start_odometer IS NULL OR start_odometer BETWEEN 0 AND 9999999);
ALTER TABLE tours ADD COLUMN end_odometer INTEGER CHECK(end_odometer IS NULL OR end_odometer BETWEEN 0 AND 9999999);
ALTER TABLE tours ADD COLUMN workflow_version INTEGER NOT NULL DEFAULT 1;
