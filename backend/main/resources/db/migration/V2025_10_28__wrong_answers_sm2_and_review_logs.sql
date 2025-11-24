-- Migration: add SM-2 scheduling fields and review logs table
-- Up
ALTER TABLE wrong_answer_records
  ADD COLUMN IF NOT EXISTS repetitions INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ease_factor DOUBLE DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS interval_days INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_quality INT;

CREATE TABLE IF NOT EXISTS wrong_answer_review_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    wrong_answer_id BIGINT NOT NULL,
    result VARCHAR(20) NOT NULL,
    time_spent_sec INT DEFAULT 0,
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    notes TEXT,
    review_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_review_logs_user_record ON wrong_answer_review_logs(user_id, wrong_answer_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_time ON wrong_answer_review_logs(review_at);

-- Down (manual rollback example)
-- ALTER TABLE wrong_answer_records DROP COLUMN last_quality;
-- ALTER TABLE wrong_answer_records DROP COLUMN interval_days;
-- ALTER TABLE wrong_answer_records DROP COLUMN ease_factor;
-- ALTER TABLE wrong_answer_records DROP COLUMN repetitions;
-- DROP TABLE wrong_answer_review_logs;

