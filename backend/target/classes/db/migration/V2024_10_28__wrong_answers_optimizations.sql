-- Wrong Answers Optimization - Indexes and Performance
-- Date: 2024-10-28

-- Add indexes for faster queries
CREATE INDEX idx_wrong_answer_user_status 
  ON wrong_answer_record(user_id, review_status);

CREATE INDEX idx_wrong_answer_user_priority 
  ON wrong_answer_record(user_id, review_priority DESC);

CREATE INDEX idx_wrong_answer_user_next_review 
  ON wrong_answer_record(user_id, next_review_time);

CREATE INDEX idx_wrong_answer_user_created 
  ON wrong_answer_record(user_id, created_at DESC);

-- Add indexes for review logs
CREATE INDEX idx_review_log_record_user 
  ON wrong_answer_review_log(record_id, user_id, review_date DESC);

CREATE INDEX idx_review_log_user_date 
  ON wrong_answer_review_log(user_id, review_date);

-- Add new columns if not exist
ALTER TABLE wrong_answer_record 
  ADD COLUMN IF NOT EXISTS interval_days INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS next_review_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing next_review_time if null
UPDATE wrong_answer_record 
  SET next_review_time = DATE_ADD(created_at, INTERVAL 1 DAY)
  WHERE next_review_time IS NULL;

-- Add mastery status column
ALTER TABLE wrong_answer_record
  ADD COLUMN IF NOT EXISTS mastery_status VARCHAR(20) DEFAULT 'unreveiwed';

-- Create review_plans table for storing user's review plans
CREATE TABLE IF NOT EXISTS review_plan (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_days INT NOT NULL,
  hours_per_day DECIMAL(3,1) NOT NULL,
  estimated_completion_date DATE,
  total_questions_to_review INT NOT NULL,
  questions_per_day INT NOT NULL,
  estimated_success_rate INT,
  focus_areas VARCHAR(500),
  revision_strategy VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_user_id (user_id),
  KEY idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create review_sessions table
CREATE TABLE IF NOT EXISTS review_session (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  plan_id BIGINT,
  day_number INT,
  session_date DATE,
  total_questions INT NOT NULL,
  completed_count INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  total_duration_seconds INT DEFAULT 0,
  session_status VARCHAR(20),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_user_id (user_id),
  KEY idx_plan_id (plan_id),
  KEY idx_date (session_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create analytics cache table for performance
CREATE TABLE IF NOT EXISTS wrong_answer_analytics (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  analytics_date DATE NOT NULL,
  total_count INT DEFAULT 0,
  mastered_count INT DEFAULT 0,
  reviewing_count INT DEFAULT 0,
  unreveiwed_count INT DEFAULT 0,
  average_mastery INT DEFAULT 0,
  overdue_count INT DEFAULT 0,
  daily_review_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_date (user_id, analytics_date),
  KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create table for AI analysis results
CREATE TABLE IF NOT EXISTS wrong_answer_analysis (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  record_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  root_causes JSON,
  learning_hints JSON,
  concepts_to_review JSON,
  confidence DECIMAL(3,2),
  analyzed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_record_id (record_id),
  KEY idx_user_id (user_id),
  FOREIGN KEY (record_id) REFERENCES wrong_answer_record(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add stored procedure for calculating statistics
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS calculate_wrong_answer_stats(
  IN p_user_id BIGINT,
  IN p_stats_date DATE
)
BEGIN
  INSERT INTO wrong_answer_analytics (
    user_id, analytics_date, total_count, mastered_count, 
    reviewing_count, unreveiwed_count, average_mastery, overdue_count
  )
  SELECT
    p_user_id,
    p_stats_date,
    COUNT(*),
    SUM(CASE WHEN review_status = 'mastered' THEN 1 ELSE 0 END),
    SUM(CASE WHEN review_status = 'reviewing' THEN 1 ELSE 0 END),
    SUM(CASE WHEN review_status = 'unreveiwed' THEN 1 ELSE 0 END),
    ROUND(AVG(CASE WHEN correct_count + wrong_count > 0 
      THEN correct_count * 100.0 / (correct_count + wrong_count)
      ELSE 0 END)),
    SUM(CASE WHEN review_priority >= 200 THEN 1 ELSE 0 END)
  FROM wrong_answer_record
  WHERE user_id = p_user_id
  ON DUPLICATE KEY UPDATE
    total_count = VALUES(total_count),
    mastered_count = VALUES(mastered_count),
    reviewing_count = VALUES(reviewing_count),
    unreveiwed_count = VALUES(unreveiwed_count),
    average_mastery = VALUES(average_mastery),
    overdue_count = VALUES(overdue_count),
    updated_at = NOW();
END //
DELIMITER ;
