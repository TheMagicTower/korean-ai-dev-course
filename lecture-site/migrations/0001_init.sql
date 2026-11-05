PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('student', 'admin')),
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  CHECK ((role = 'student' AND student_id IS NOT NULL) OR (role = 'admin' AND student_id IS NULL))
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assignment INTEGER NOT NULL CHECK (assignment BETWEEN 0 AND 5),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  project_url TEXT NOT NULL DEFAULT '',
  repository_url TEXT NOT NULL DEFAULT '',
  data_url TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'revision_requested')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (student_id, assignment)
);
CREATE INDEX IF NOT EXISTS submissions_assignment_updated ON submissions(assignment, updated_at);

CREATE TABLE IF NOT EXISTS submission_versions (
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  project_url TEXT NOT NULL,
  repository_url TEXT NOT NULL,
  data_url TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (submission_id, version)
);

CREATE TRIGGER IF NOT EXISTS snapshot_submission_insert
AFTER INSERT ON submissions
BEGIN
  INSERT INTO submission_versions (submission_id, version, title, body, project_url, repository_url, data_url, created_at)
  VALUES (NEW.id, NEW.version, NEW.title, NEW.body, NEW.project_url, NEW.repository_url, NEW.data_url, NEW.updated_at);
END;

CREATE TRIGGER IF NOT EXISTS snapshot_submission_update
AFTER UPDATE OF version ON submissions
WHEN NEW.version != OLD.version
BEGIN
  INSERT INTO submission_versions (submission_id, version, title, body, project_url, repository_url, data_url, created_at)
  VALUES (NEW.id, NEW.version, NEW.title, NEW.body, NEW.project_url, NEW.repository_url, NEW.data_url, NEW.updated_at);
END;

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('reviewed', 'revision_requested')),
  scores_json TEXT,
  total INTEGER CHECK (total BETWEEN 0 AND 100),
  feedback TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (submission_id, version) REFERENCES submission_versions(submission_id, version) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS reviews_submission_version ON reviews(submission_id, version, created_at);

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket_key TEXT PRIMARY KEY,
  hits INTEGER NOT NULL DEFAULT 1,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS rate_limits_expiry ON rate_limits(expires_at);
