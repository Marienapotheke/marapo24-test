CREATE TABLE IF NOT EXISTS office_credentials(uid TEXT PRIMARY KEY REFERENCES users(uid),username TEXT NOT NULL UNIQUE,salt TEXT NOT NULL,password_hash TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,must_change INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS office_sessions(token_hash TEXT PRIMARY KEY,uid TEXT NOT NULL REFERENCES users(uid),credential_hash TEXT NOT NULL,expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS office_session_user ON office_sessions(uid);
CREATE TABLE IF NOT EXISTS office_attempts(key TEXT PRIMARY KEY,window INTEGER NOT NULL,count INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS password_reset_requests(uid TEXT PRIMARY KEY REFERENCES users(uid),requested_at TEXT NOT NULL);
