package com.interview.service.impl;

import com.interview.dto.PageResponse;
import com.interview.dto.FacetBucket;
import com.interview.dto.QuestionFacetsResponse;
import com.interview.entity.Category;
import com.interview.entity.Question;
import com.interview.exception.BusinessException;
import com.interview.mapper.CategoryMapper;
import com.interview.mapper.QuestionMapper;
import com.interview.mapper.TagMapper;
import com.interview.service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class QuestionServiceImpl implements QuestionService {

    @Autowired
    private QuestionMapper questionMapper;

    @Autowired
    private CategoryMapper categoryMapper;
    @Autowired
    private TagMapper tagMapper;

    @Override
    @Cacheable(value = "categories", key = "#type + ':' + (#parentId == null ? 'root' : #parentId)")
    public List<Category> getCategories(String type, Long parentId) {
        return categoryMapper.selectAll(type, parentId);
    }

    @Override
    public PageResponse<Question> getQuestions(int page, int size, Long categoryId,
                                             String difficulty, String type,
                                             String keyword, String tags,
                                             String sort) {
        int offset = (page - 1) * size;
        java.util.List<String> tagList = null;
        if (tags != null && !tags.isEmpty()) {
            tagList = java.util.Arrays.stream(tags.split(","))
                    .map(String::trim).filter(s -> !s.isEmpty()).toList();
        }
        List<Question> questions = questionMapper.selectPage(offset, size, categoryId,
                difficulty, type, keyword, tags, tagList, sort);
        long total = questionMapper.countByCondition(categoryId, difficulty, type, keyword, tags, tagList);

        return PageResponse.of(questions, page, size, total);
    }

    @Override
    public Question getQuestionById(Long id) {
        Question question = questionMapper.selectById(id);
        if (question == null) {
            throw new BusinessException(404, "棰樼洰涓嶅瓨鍦?);
        }
        // 澧炲姞娴忚娆℃暟
        questionMapper.incrementViewCount(id);
        return question;
    }

    @Override
    @CacheEvict(value = {"questionFacets", "categories"}, allEntries = true)
    public Question createQuestion(Question question) {
        question.setCreatedAt(LocalDateTime.now());
        question.setUpdatedAt(LocalDateTime.now());
        question.setViewCount(0);
        question.setLikeCount(0);

        questionMapper.insert(question);
        return question;
    }

    @Override
    @CacheEvict(value = {"questionFacets", "categories"}, allEntries = true)
    public Question updateQuestion(Long id, Question question) {
        Question existingQuestion = questionMapper.selectById(id);
        if (existingQuestion == null) {
            throw new BusinessException(404, "棰樼洰涓嶅瓨鍦?);
        }

        question.setId(id);
        question.setUpdatedAt(LocalDateTime.now());
        questionMapper.updateById(question);
        return question;
    }

    @Override
    @CacheEvict(value = {"questionFacets", "categories"}, allEntries = true)
    public void deleteQuestion(Long id) {
        Question question = questionMapper.selectById(id);
        if (question == null) {
            throw new BusinessException(404, "棰樼洰涓嶅瓨鍦?);
        }
        questionMapper.deleteById(id);
    }

    @Override
    public void incrementViewCount(Long id) {
        questionMapper.incrementViewCount(id);
    }

    @Override
    public void likeQuestion(Long id) {
        questionMapper.incrementLikeCount(id);
    }

    @Override
    @Cacheable(value = "questionFacets", key = "(#categoryId == null ? 'all' : #categoryId) + '|' + (#keyword == null ? '' : #keyword) + '|' + (#tags == null ? '' : #tags)", unless = "#result == null")
    public QuestionFacetsResponse getFacets(Long categoryId, String keyword, String tags) {
        List<FacetBucket> difficulties = questionMapper.countByDifficulty(categoryId, keyword, tags);
        List<FacetBucket> categories = questionMapper.countByCategory(keyword, tags);
        return new QuestionFacetsResponse(difficulties, categories);
    }

    @Override
    public com.interview.dto.ApiResponse<?> importQuestions(java.util.List<java.util.Map<String, Object>> items) {
        int success = 0; int failed = 0;
        java.util.List<String> errors = new java.util.ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            var it = items.get(i);
            try {
                Question q = new Question();
                q.setTitle((String) it.getOrDefault("title", ""));
                q.setContent((String) it.getOrDefault("content", ""));
                q.setDifficulty((String) it.getOrDefault("difficulty", "medium"));
                q.setType((String) it.getOrDefault("type", "subjective"));
                Object cat = it.get("category_id");
                if (cat instanceof Number) q.setCategoryId(((Number)cat).longValue());
                q.setAnswer((String) it.getOrDefault("answer", null));
                q.setCreatedAt(java.time.LocalDateTime.now());
                q.setUpdatedAt(java.time.LocalDateTime.now());
                q.setViewCount(0); q.setLikeCount(0);
                questionMapper.insert(q);
                // tags
                Object tagsObj = it.get("tags");
                if (tagsObj instanceof java.util.List<?> list) {
                    for (Object o : list) {
                        if (o == null) continue; String name = String.valueOf(o).trim(); if (name.isEmpty()) continue;
                        Tag tag = tagMapper.selectByName(name);
                        if (tag == null) { tag = new Tag(); tag.setName(name); tag.setSlug(name.toLowerCase()); tagMapper.insert(tag); }
                        tagMapper.linkQuestionTag(q.getId(), tag.getId());
                    }
                }
                success++;
            } catch (Exception e) {
                failed++; errors.add("row=" + i + ": " + e.getMessage());
            }
        }
        java.util.Map<String,Object> res = new java.util.HashMap<>();
        res.put("success", success); res.put("failed", failed); res.put("errors", errors);
        return com.interview.dto.ApiResponse.success(res);
    }

    @Override
    public void publishQuestion(Long id) {\n        Question q = questionMapper.selectById(id);\n        if (q == null) throw new BusinessException(404, "题目不存在");\n        questionMapper.publish(id);\n    }

    @Override
    public void archiveQuestion(Long id) {\n        Question q = questionMapper.selectById(id);\n        if (q == null) throw new BusinessException(404, "题目不存在");\n        questionMapper.archive(id);\n    }
}
