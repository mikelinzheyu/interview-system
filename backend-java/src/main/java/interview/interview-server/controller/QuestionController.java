package com.interview.controller;

import com.interview.dto.ApiResponse;
import com.interview.dto.PageResponse;
import com.interview.entity.Category;
import com.interview.entity.Question;
import com.interview.service.QuestionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

//import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping
public class QuestionController {

    @Autowired
    private QuestionService questionService;

    @GetMapping("/categories")
    public ApiResponse<List<Category>> getCategories(
            @RequestParam(required = false) String type,
            @RequestParam(name = "parent_id", required = false) Long parentId) {
        List<Category> categories = questionService.getCategories(type, parentId);
        return ApiResponse.success(categories);
    }

    @GetMapping("/questions")
    public ApiResponse<PageResponse<Question>> getQuestions(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(name = "category_id", required = false) Long categoryId,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String tags) {

        PageResponse<Question> result = questionService.getQuestions(
                page, size, categoryId, difficulty, type, keyword, tags);
        return ApiResponse.success(result);
    }

    @GetMapping("/questions/{id}")
    public ApiResponse<Question> getQuestionById(@PathVariable Long id) {
        Question question = questionService.getQuestionById(id);
        return ApiResponse.success(question);
    }

    @PostMapping("/questions")
    public ApiResponse<Question> createQuestion(@Valid @RequestBody Question question) {
        Question createdQuestion = questionService.createQuestion(question);
        return ApiResponse.success(createdQuestion);
    }

    @PutMapping("/questions/{id}")
    public ApiResponse<Question> updateQuestion(
            @PathVariable Long id,
            @Valid @RequestBody Question question) {
        Question updatedQuestion = questionService.updateQuestion(id, question);
        return ApiResponse.success(updatedQuestion);
    }

    @DeleteMapping("/questions/{id}")
    public ApiResponse<Void> deleteQuestion(@PathVariable Long id) {
        questionService.deleteQuestion(id);
        return ApiResponse.success();
    }

    @PostMapping("/questions/{id}/like")
    public ApiResponse<Void> likeQuestion(@PathVariable Long id) {
        questionService.likeQuestion(id);
        return ApiResponse.success();
    }
}