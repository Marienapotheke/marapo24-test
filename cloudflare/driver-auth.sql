CREATE TABLE IF NOT EXISTS driver_devices (
 id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, label TEXT NOT NULL,
 active INTEGER NOT NULL CHECK(active IN(0,1)),created_at TEXT NOT NULL,expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS driver_pins (
 uid TEXT PRIMARY KEY REFERENCES users(uid),salt TEXT NOT NULL,pin_hash TEXT NOT NULL,
 active INTEGER NOT NULL CHECK(active IN(0,1))
);
CREATE TABLE IF NOT EXISTS driver_sessions (
 token_hash TEXT PRIMARY KEY,uid TEXT NOT NULL REFERENCES users(uid),device_id TEXT NOT NULL REFERENCES driver_devices(id),expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS driver_sessions_device ON driver_sessions(device_id);
CREATE INDEX IF NOT EXISTS driver_sessions_uid ON driver_sessions(uid);
CREATE TABLE IF NOT EXISTS driver_pin_attempts(uid TEXT PRIMARY KEY,window INTEGER NOT NULL,count INTEGER NOT NULL);
