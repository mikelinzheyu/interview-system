-- 添加 major_group_id 列到 questions 表
-- 版本：V2.0__add_major_group_id.sql
-- 描述：为题库实现按专业大类隔离而添加 major_group_id 字段

ALTER TABLE questions
ADD COLUMN major_group_id BIGINT COMMENT '题目所属专业大类ID' AFTER category_id,
ADD INDEX idx_major_group_id (major_group_id);

-- 如果现有题目需要迁移到 major_group_id，可以根据以下逻辑执行：
-- 注意：这里需要根据你的实际分类关系来调整，以下是示例逻辑

-- 示例 1：如果有分类到专业大类的映射关系，可以使用以下 SQL
-- UPDATE questions q
-- SET q.major_group_id = (
--   SELECT c.major_group_id FROM categories c WHERE c.id = q.category_id
-- )
-- WHERE q.category_id IS NOT NULL;

-- 示例 2：或者通过 discipline 表的关联来映射
-- UPDATE questions q
-- JOIN categories c ON q.category_id = c.id
-- JOIN major_groups mg ON c.major_group_id = mg.id
-- SET q.major_group_id = mg.id;

-- 注意：在执行上述迁移 SQL 前，请确保：
-- 1. categories 表有 major_group_id 字段
-- 2. major_groups 表存在
-- 3. 分类关系已正确建立
