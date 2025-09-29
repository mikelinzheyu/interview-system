package com.interview.service.impl;

import com.interview.dto.PageResponse;
import com.interview.entity.Category;
import com.interview.entity.Question;
import com.interview.exception.BusinessException;
import com.interview.mapper.CategoryMapper;
import com.interview.mapper.QuestionMapper;
import com.interview.service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class QuestionServiceImpl implements QuestionService {

    @Autowired
    private QuestionMapper questionMapper;

    @Autowired
    private CategoryMapper categoryMapper;

    @Override
    public List<Category> getCategories(String type, Long parentId) {
        return categoryMapper.selectAll(type, parentId);
    }

    @Override
    public PageResponse<Question> getQuestions(int page, int size, Long categoryId,
                                             String difficulty, String type,
                                             String keyword, String tags) {
        int offset = (page - 1) * size;
        List<Question> questions = questionMapper.selectPage(offset, size, categoryId,
                difficulty, type, keyword, tags);
        long total = questionMapper.countByCondition(categoryId, difficulty, type, keyword, tags);

        return PageResponse.of(questions, page, size, total);
    }

    @Override
    public Question getQuestionById(Long id) {
        Question question = questionMapper.selectById(id);
        if (question == null) {
            throw new BusinessException(404, "题目不存在");
        }
        // 增加浏览次数
        questionMapper.incrementViewCount(id);
        return question;
    }

    @Override
    public Question createQuestion(Question question) {
        question.setCreatedAt(LocalDateTime.now());
        question.setUpdatedAt(LocalDateTime.now());
        question.setViewCount(0);
        question.setLikeCount(0);

        questionMapper.insert(question);
        return question;
    }

    @Override
    public Question updateQuestion(Long id, Question question) {
        Question existingQuestion = questionMapper.selectById(id);
        if (existingQuestion == null) {
            throw new BusinessException(404, "题目不存在");
        }

        question.setId(id);
        question.setUpdatedAt(LocalDateTime.now());
        questionMapper.updateById(question);
        return question;
    }

    @Override
    public void deleteQuestion(Long id) {
        Question question = questionMapper.selectById(id);
        if (question == null) {
            throw new BusinessException(404, "题目不存在");
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
}