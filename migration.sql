USE interview_system;

-- Add major_group_id column if not exists
ALTER TABLE questions
ADD COLUMN major_group_id BIGINT COMMENT '题目所属专业大类ID' AFTER category_id,
ADD INDEX idx_major_group_id (major_group_id);

-- Backfill existing questions with major_group_id
UPDATE questions q
SET q.major_group_id = (
  SELECT c.major_group_id FROM categories c WHERE c.id = q.category_id
)
WHERE q.major_group_id IS NULL AND q.category_id IS NOT NULL;

-- Verify the migration
SELECT COUNT(*) as total_questions,
       COUNT(CASE WHEN major_group_id IS NOT NULL THEN 1 END) as filled,
       COUNT(CASE WHEN major_group_id IS NULL THEN 1 END) as empty
FROM questions;
