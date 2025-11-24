CREATE TABLE wrong_answer_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    source VARCHAR(50),
    source_instance_id BIGINT,
    wrong_count INT,
    correct_count INT,
    last_wrong_time TIMESTAMP,
    last_correct_time TIMESTAMP,
    review_status VARCHAR(20),
    next_review_time TIMESTAMP,
    review_priority VARCHAR(10),
    repetitions INT DEFAULT 0,
    ease_factor DOUBLE DEFAULT 2.5,
    interval_days INT DEFAULT 0,
    last_quality INT,
    user_notes TEXT,
    user_tags TEXT,
    question_title VARCHAR(255),
    question_content TEXT,
    difficulty VARCHAR(20),
    knowledge_points TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE UNIQUE INDEX uk_wrong_answers_user_question ON wrong_answer_records(user_id, question_id);
CREATE INDEX idx_wrong_answers_user_status ON wrong_answer_records(user_id, review_status);
CREATE INDEX idx_wrong_answers_user_source ON wrong_answer_records(user_id, source);

-- Review logs table for wrong answers
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

CREATE INDEX idx_review_logs_user_record ON wrong_answer_review_logs(user_id, wrong_answer_id);
CREATE INDEX idx_review_logs_time ON wrong_answer_review_logs(review_at);
