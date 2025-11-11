package com.interview.server.service.impl;

import com.interview.common.constants.CacheKey;
import com.interview.common.dto.PageRequest;
import com.interview.common.dto.PageResponse;
import com.interview.common.exception.BusinessException;
import com.interview.entity.Question;
import com.interview.server.mapper.QuestionMapper;
import com.interview.server.mapper.CategoryMapper;
import com.interview.server.service.QuestionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class QuestionServiceImpl implements QuestionService {

    @Autowired
    private QuestionMapper questionMapper;

    @Autowired
    private CategoryMapper categoryMapper;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Override
    public PageResponse<Question> getQuestions(int page, int size, Long majorGroupId, Long categoryId,
                                               String difficulty, String type,
                                               String keyword, String tags,
                                               String sort) {
        // majorGroupId 是强制参数
        if (majorGroupId != null && majorGroupId <= 0) {
            return new PageResponse<>(new java.util.ArrayList<>(), 0, page, size);
        }

        int offset = (page - 1) * size;
        
        // 处理标签列表
        List<String> tagList = new java.util.ArrayList<>();
        if (tags != null && !tags.isEmpty()) {
            tagList = java.util.Arrays.asList(tags.split(","));
        }

        // 查询题目列表
        List<Question> questions = questionMapper.selectPage(offset, size, majorGroupId, categoryId,
                difficulty, type, keyword, tags, tagList, sort);

        // 查询总数
        long total = questionMapper.countByCondition(majorGroupId, categoryId, difficulty, type, keyword, tags, tagList);

        return new PageResponse<>(questions, total, page, size);
    }

    @Override
    public Map<String, Object> getFacets(Long majorGroupId, Long categoryId,
                                         String difficulty, String type,
                                         String keyword, String tags) {
        Map<String, Object> facets = new java.util.HashMap<>();
        
        // 按难度统计
        Map<String, Long> difficultyFacets = questionMapper.countByDifficulty(majorGroupId, categoryId,
                difficulty, type, keyword, tags);
        facets.put("difficulty", difficultyFacets);

        // 按类型统计
        Map<String, Long> typeFacets = questionMapper.countByCategory(majorGroupId, categoryId,
                difficulty, type, keyword, tags);
        facets.put("type", typeFacets);

        return facets;
    }

    @Override
    public Question getQuestionById(Long id) {
        return questionMapper.selectById(id);
    }

    @Override
    public void createQuestion(Question question) {
        if (question.getMajorGroupId() == null) {
            throw new BusinessException(400, "majorGroupId is required");
        }
        questionMapper.insert(question);
    }

    @Override
    public void updateQuestion(Question question) {
        questionMapper.updateById(question);
    }

    @Override
    public void deleteQuestion(Long id) {
        questionMapper.deleteById(id);
    }

    @Override
    public void publishQuestion(Long id) {
        Question q = questionMapper.selectById(id);
        if (q == null) throw new BusinessException(404, "题目不存在");
        questionMapper.publish(id);
    }

    @Override
    public void archiveQuestion(Long id) {
        Question q = questionMapper.selectById(id);
        if (q == null) throw new BusinessException(404, "题目不存在");
        questionMapper.archive(id);
    }
}
