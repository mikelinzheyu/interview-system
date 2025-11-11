package com.interview.controller;

import com.interview.dto.ApiResponse;
import com.interview.dto.PageResponse;
import com.interview.dto.QuestionFacetsResponse;
import com.interview.entity.Category;
import com.interview.entity.Question;
import com.interview.service.QuestionService;
import com.interview.mapper.TagMapper;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

//import javax.validation.Valid;
import java.util.List;
import java.util.StringJoiner;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping
public class QuestionController {

    @Autowired
    private QuestionService questionService;
    @Autowired
    private TagMapper tagMapper;

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
            @RequestParam(name = "major_group_id", required = false) Long majorGroupId,
            @RequestParam(name = "category_id", required = false) Long categoryId,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String type,
            @RequestParam(required = false, name = "keyword") String keyword,
            @RequestParam(required = false, name = "q") String q,
            @RequestParam(required = false) String tags,
            @RequestParam(required = false, defaultValue = "recent") String sort) {

        String kw = (keyword != null && !keyword.isEmpty()) ? keyword : q;
        PageResponse<Question> result = questionService.getQuestions(
                page, size, majorGroupId, categoryId, difficulty, type, kw, tags, sort);
        return ApiResponse.success(result);
    }

    @GetMapping("/questions/facets")
    public ApiResponse<QuestionFacetsResponse> getQuestionFacets(
            @RequestParam(name = "major_group_id", required = false) Long majorGroupId,
            @RequestParam(name = "category_id", required = false) Long categoryId,
            @RequestParam(required = false, name = "keyword") String keyword,
            @RequestParam(required = false, name = "q") String q,
            @RequestParam(required = false) String tags) {
        String kw = (keyword != null && !keyword.isEmpty()) ? keyword : q;
        QuestionFacetsResponse facets = questionService.getFacets(majorGroupId, categoryId, kw, tags);
        return ApiResponse.success(facets);
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

    @GetMapping("/questions/export")
    public ResponseEntity<byte[]> exportQuestions(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "1000") int size,
            @RequestParam(name = "category_id", required = false) Long categoryId,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String type,
            @RequestParam(required = false, name = "keyword") String keyword,
            @RequestParam(required = false, name = "q") String q,
            @RequestParam(required = false) String tags
    ) {
        String kw = (keyword != null && !keyword.isEmpty()) ? keyword : q;
        PageResponse<Question> result = questionService.getQuestions(page, size, categoryId, difficulty, type, kw, tags, "recent");
        StringBuilder sb = new StringBuilder();
        sb.append("id,title,difficulty,category_id,created_at\n");
        for (Question qn : result.getItems()) {
            StringJoiner row = new StringJoiner(",");
            row.add(String.valueOf(qn.getId()));
            String safeTitle = qn.getTitle() == null ? "" : qn.getTitle().replace('"','\'').replace('\n',' ').replace('\r',' ');
            row.add('"' + safeTitle + '"');
            row.add(qn.getDifficulty() == null ? "" : qn.getDifficulty());
            row.add(qn.getCategoryId() == null ? "" : String.valueOf(qn.getCategoryId()));
            row.add(qn.getCreatedAt() == null ? "" : qn.getCreatedAt().toString());
            sb.append(row.toString()).append('\n');
        }
        byte[] bytes = sb.toString().getBytes(StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=questions.csv");
        return ResponseEntity.ok().headers(headers).body(bytes);
    }

    @PostMapping("/questions/import")
    public ApiResponse<?> importQuestions(@RequestBody Map<String, Object> payload) {
        Object items = payload.get("items");
        if (!(items instanceof List<?> list)) {
            return ApiResponse.error(400, "payload.items must be an array");
        }
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> cast = (List<Map<String, Object>>) (List<?>) list;
        return questionService.importQuestions(cast);
    }

    @PostMapping("/questions/{id}/publish")
    public ApiResponse<Void> publish(@PathVariable Long id) {
        questionService.publishQuestion(id);
        return ApiResponse.success();
    }

    @PostMapping("/questions/{id}/archive")
    public ApiResponse<Void> archive(@PathVariable Long id) {
        questionService.archiveQuestion(id);
        return ApiResponse.success();
    }

    @GetMapping("/tags")
    public ApiResponse<List<com.interview.entity.Tag>> listTags(@RequestParam(required = false) String q,
                                                                @RequestParam(required = false, defaultValue = "20") Integer limit) {
        var list = tagMapper.search(q, limit);
        return ApiResponse.success(list);
    }

    // Backward compatible path
    @GetMapping("/questions/tags")
    public ApiResponse<List<com.interview.entity.Tag>> listTagsCompat(@RequestParam(required = false) String q,
                                                                      @RequestParam(required = false, defaultValue = "20") Integer limit) {
        var list = tagMapper.search(q, limit);
        return ApiResponse.success(list);
    }
}
