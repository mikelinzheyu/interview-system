package com.interview.service;

import com.interview.dto.PageResponse;
import com.interview.entity.Category;
import com.interview.entity.Question;

import java.util.List;

public interface QuestionService {

    List<Category> getCategories(String type, Long parentId);


    PageResponse<Question> getQuestions(int page, int size, Long categoryId,
                                      String difficulty, String type,
                                      String keyword, String tags);


    Question getQuestionById(Long id);

    Question createQuestion(Question question);

    Question updateQuestion(Long id, Question question);

    void deleteQuestion(Long id);

    void incrementViewCount(Long id);

    void likeQuestion(Long id);
}