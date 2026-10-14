CREATE TABLE IF NOT EXISTS customers (
 id TEXT PRIMARY KEY,search_name TEXT NOT NULL,data TEXT NOT NULL CHECK(json_valid(data)),last_delivered_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS customers_recent ON customers(last_delivered_at);
CREATE TABLE IF NOT EXISTS tour_orders (
 tour_id TEXT PRIMARY KEY REFERENCES tours(id),stop_ids TEXT NOT NULL CHECK(json_valid(stop_ids)),revision INTEGER NOT NULL,updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS address_locations (
 id TEXT PRIMARY KEY,lat REAL NOT NULL,lon REAL NOT NULL,provider TEXT NOT NULL,updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS routing_usage(day TEXT PRIMARY KEY,credits INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS routing_credit_events(id TEXT PRIMARY KEY,at INTEGER NOT NULL,credits INTEGER NOT NULL CHECK(credits>0));
CREATE INDEX IF NOT EXISTS routing_credit_time ON routing_credit_events(at);
CREATE TRIGGER IF NOT EXISTS remember_delivered_customer AFTER INSERT ON proofs
WHEN json_extract(NEW.data,'$.status')='zugestellt' AND json_extract(NEW.data,'$.customerId') IS NOT NULL
BEGIN
 INSERT INTO customers(id,search_name,data,last_delivered_at)
 VALUES(json_extract(NEW.data,'$.customerId'),json_extract(NEW.data,'$.customerSearchName'),
 json_object('type',json_extract(NEW.data,'$.type'),'name',json_extract(NEW.data,'$.name'),'street',json_extract(NEW.data,'$.street'),'postalCode',json_extract(NEW.data,'$.postalCode'),'city',json_extract(NEW.data,'$.city'),'phone',json_extract(NEW.data,'$.phone')),
 json_extract(NEW.data,'$.completedAt'))
 ON CONFLICT(id) DO UPDATE SET search_name=excluded.search_name,data=excluded.data,last_delivered_at=excluded.last_delivered_at;
END;
