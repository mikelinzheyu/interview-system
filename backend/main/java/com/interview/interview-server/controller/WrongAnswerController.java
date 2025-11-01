package com.interview.controller;

import com.interview.dto.ApiResponse;
import com.interview.dto.RecordWrongAnswerRequest;
import com.interview.dto.WrongAnswerDto;
import com.interview.dto.WrongAnswerStatisticsDto;
import com.interview.service.WrongAnswerService;
import com.interview.util.JwtUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for wrong answer management
 */
@RestController
@RequestMapping("/wrong-answers")
public class WrongAnswerController {

    private final WrongAnswerService wrongAnswerService;
    private final JwtUtils jwtUtils;

    public WrongAnswerController(WrongAnswerService wrongAnswerService, JwtUtils jwtUtils) {
        this.wrongAnswerService = wrongAnswerService;
        this.jwtUtils = jwtUtils;
    }

    /**
     * Record a wrong answer
     */
    @PostMapping
    public ApiResponse<WrongAnswerDto> recordWrongAnswer(
        @RequestHeader("Authorization") String token,
        @RequestBody RecordWrongAnswerRequest request
    ) {
        try {
            Long userId = jwtUtils.getUserIdFromToken(extractToken(token));
            WrongAnswerDto result = wrongAnswerService.recordWrongAnswer(userId, request);
            return ApiResponse.success(result, "Wrong answer recorded successfully");
        } catch (Exception e) {
            return ApiResponse.error(400, "Failed to record wrong answer: " + e.getMessage());
        }
    }

    /**
     * Get all wrong answers for current user
     */
    @GetMapping
    public ApiResponse<List<WrongAnswerDto>> getWrongAnswers(
        @RequestHeader("Authorization") String token
    ) {
        try {
            Long userId = jwtUtils.getUserIdFromToken(extractToken(token));
            List<WrongAnswerDto> result = wrongAnswerService.getWrongAnswers(userId);
            return ApiResponse.success(result, "Wrong answers retrieved successfully");
        } catch (Exception e) {
            return ApiResponse.error(400, "Failed to retrieve wrong answers: " + e.getMessage());
        }
    }

    /**
     * Get wrong answers by status
     */
    @GetMapping("/status/{status}")
    public ApiResponse<List<WrongAnswerDto>> getWrongAnswersByStatus(
        @RequestHeader("Authorization") String token,
        @PathVariable String status
    ) {
        try {
            Long userId = jwtUtils.getUserIdFromToken(extractToken(token));
            List<WrongAnswerDto> result = wrongAnswerService.getWrongAnswersByStatus(userId, status);
            return ApiResponse.success(result, "Wrong answers retrieved successfully");
        } catch (Exception e) {
            return ApiResponse.error(400, "Failed to retrieve wrong answers: " + e.getMessage());
        }
    }

    /**
     * Get wrong answers by source
     */
    @GetMapping("/source/{source}")
    public ApiResponse<List<WrongAnswerDto>> getWrongAnswersBySource(
        @RequestHeader("Authorization") String token,
        @PathVariable String source
    ) {
        try {
            Long userId = jwtUtils.getUserIdFromToken(extractToken(token));
            List<WrongAnswerDto> result = wrongAnswerService.getWrongAnswersBySource(userId, source);
            return ApiResponse.success(result, "Wrong answers retrieved successfully");
        } catch (Exception e) {
            return ApiResponse.error(400, "Failed to retrieve wrong answers: " + e.getMessage());
        }
    }

    /**
     * Get questions due for review
     */
    @GetMapping("/due-for-review")
    public ApiResponse<List<WrongAnswerDto>> getDueForReview(
        @RequestHeader("Authorization") String token
    ) {
        try {
            Long userId = jwtUtils.getUserIdFromToken(extractToken(token));
            List<WrongAnswerDto> result = wrongAnswerService.getDueForReview(userId);
            return ApiResponse.success(result, "Questions due for review retrieved successfully");
        } catch (Exception e) {
            return ApiResponse.error(400, "Failed to retrieve due questions: " + e.getMessage());
        }
    }

    /**
     * Get statistics for wrong answers
     */
    @GetMapping("/statistics")
    public ApiResponse<WrongAnswerStatisticsDto> getStatistics(
        @RequestHeader("Authorization") String token
    ) {
        try {
            Long userId = jwtUtils.getUserIdFromToken(extractToken(token));
            WrongAnswerStatisticsDto result = wrongAnswerService.getStatistics(userId);
            return ApiResponse.success(result, "Statistics retrieved successfully");
        } catch (Exception e) {
            return ApiResponse.error(400, "Failed to retrieve statistics: " + e.getMessage());
        }
    }

    /**
     * Get a specific wrong answer record
     */
    @GetMapping("/{id}")
    public ApiResponse<WrongAnswerDto> getWrongAnswer(
        @RequestHeader("Authorization") String token,
        @PathVariable Long id
    ) {
        try {
            Long userId = jwtUtils.getUserIdFromToken(extractToken(token));
            WrongAnswerDto result = wrongAnswerService.getWrongAnswer(userId, id);
            if (result == null) {
                return ApiResponse.error(404, "Wrong answer record not found");
            }
            return ApiResponse.success(result, "Wrong answer record retrieved successfully");
        } catch (Exception e) {
            return ApiResponse.error(400, "Failed to retrieve wrong answer: " + e.getMessage());
        }
    }

    /**
     * Mark a question as mastered
     */
    @PutMapping("/{id}/mark-mastered")
    public ApiResponse<WrongAnswerDto> markAsMastered(
        @RequestHeader("Authorization") String token,
        @PathVariable Long id
    ) {
        try {
            Long userId = jwtUtils.getUserIdFromToken(extractToken(token));
            WrongAnswerDto result = wrongAnswerService.markAsMastered(userId, id);
            return ApiResponse.success(result, "Question marked as mastered");
        } catch (Exception e) {
            return ApiResponse.error(400, "Failed to update status: " + e.getMessage());
        }
    }

    /**
     * Mark a question as reviewing
     */
    @PutMapping("/{id}/mark-reviewing")
    public ApiResponse<WrongAnswerDto> markAsReviewing(
        @RequestHeader("Authorization") String token,
        @PathVariable Long id
    ) {
        try {
            Long userId = jwtUtils.getUserIdFromToken(extractToken(token));
            WrongAnswerDto result = wrongAnswerService.markAsReviewing(userId, id);
            return ApiResponse.success(result, "Question marked as reviewing");
        } catch (Exception e) {
            return ApiResponse.error(400, "Failed to update status: " + e.getMessage());
        }
    }

    /**
     * Update user notes for a wrong answer
     */
    @PutMapping("/{id}/notes")
    public ApiResponse<WrongAnswerDto> updateUserNotes(
        @RequestHeader("Authorization") String token,
        @PathVariable Long id,
        @RequestBody NotesUpdateRequest request
    ) {
        try {
            Long userId = jwtUtils.getUserIdFromToken(extractToken(token));
            WrongAnswerDto result = wrongAnswerService.updateUserNotes(userId, id, request.getNotes());
            return ApiResponse.success(result, "User notes updated successfully");
        } catch (Exception e) {
            return ApiResponse.error(400, "Failed to update notes: " + e.getMessage());
        }
    }

    /**
     * Update user tags for a wrong answer
     */
    @PutMapping("/{id}/tags")
    public ApiResponse<WrongAnswerDto> updateUserTags(
        @RequestHeader("Authorization") String token,
        @PathVariable Long id,
        @RequestBody TagsUpdateRequest request
    ) {
        try {
            Long userId = jwtUtils.getUserIdFromToken(extractToken(token));
            WrongAnswerDto result = wrongAnswerService.updateUserTags(userId, id, request.getTags());
            return ApiResponse.success(result, "User tags updated successfully");
        } catch (Exception e) {
            return ApiResponse.error(400, "Failed to update tags: " + e.getMessage());
        }
    }

    /**
     * Delete a wrong answer record
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteWrongAnswer(
        @RequestHeader("Authorization") String token,
        @PathVariable Long id
    ) {
        try {
            Long userId = jwtUtils.getUserIdFromToken(extractToken(token));
            wrongAnswerService.deleteWrongAnswer(userId, id);
            return ApiResponse.success(null, "Wrong answer record deleted successfully");
        } catch (Exception e) {
            return ApiResponse.error(400, "Failed to delete wrong answer: " + e.getMessage());
        }
    }

    /**
     * Generate review plan
     */
    @PostMapping("/generate-review-plan")
    public ApiResponse<Void> generateReviewPlan(
        @RequestHeader("Authorization") String token
    ) {
        try {
            Long userId = jwtUtils.getUserIdFromToken(extractToken(token));
            wrongAnswerService.generateReviewPlan(userId);
            return ApiResponse.success(null, "Review plan generated successfully");
        } catch (Exception e) {
            return ApiResponse.error(400, "Failed to generate review plan: " + e.getMessage());
        }
    }

    /**
     * Review once with result and time spent
     */
    @PostMapping("/{id}/review")
    public ApiResponse<WrongAnswerDto> reviewOnce(
        @RequestHeader("Authorization") String token,
        @PathVariable Long id,
        @RequestBody ReviewRequest request
    ) {
        try {
            Long userId = jwtUtils.getUserIdFromToken(extractToken(token));
            WrongAnswerDto updated = wrongAnswerService.reviewOnce(
                userId,
                id,
                request != null ? request.getResult() : null,
                request != null ? request.getTimeSpentSec() : null,
                request != null ? request.getNotes() : null
            );
            return ApiResponse.success(updated);
        } catch (Exception e) {
            return ApiResponse.error(400, "Failed to review: " + e.getMessage());
        }
    }

    /**
     * Get review logs for a wrong answer
     */
    @GetMapping("/review/logs")
    public ApiResponse<Map<String, Object>> getReviewLogs(
        @RequestHeader("Authorization") String token,
        @RequestParam Long recordId,
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer size,
        @RequestParam(required = false) String result,
        @RequestParam(required = false) String from,
        @RequestParam(required = false) String to
    ) {
        try {
            Long userId = jwtUtils.getUserIdFromToken(extractToken(token));

            // If no pagination requested, keep backward-compatible response
            if (page == null || size == null) {
                List<com.interview.entity.WrongAnswerReviewLog> logs = wrongAnswerService.getReviewLogs(userId, recordId);
                return ApiResponse.success(java.util.Collections.singletonMap("items", logs));
            }

            java.time.LocalDateTime fromTime = parseDateTime(from);
            java.time.LocalDateTime toTime = parseDateTime(to);
            com.interview.dto.PageResponse<com.interview.entity.WrongAnswerReviewLog> pr =
                wrongAnswerService.getReviewLogs(userId, recordId, result, fromTime, toTime,
                    page != null ? page : 1, size != null ? size : 20);

            java.util.Map<String, Object> body = new java.util.HashMap<>();
            body.put("items", pr.getList());
            body.put("total", pr.getPagination().getTotal());
            body.put("page", pr.getPagination().getPage());
            body.put("size", pr.getPagination().getSize());
            return ApiResponse.success(body);
        } catch (Exception e) {
            return ApiResponse.error(400, "Failed to fetch review logs: " + e.getMessage());
        }
    }

    /**
     * Batch update status for multiple wrong answers
     */
    @PutMapping("/batch/update-status")
    public ApiResponse<BatchOperationResult> batchUpdateStatus(
        @RequestHeader("Authorization") String token,
        @RequestBody BatchStatusUpdateRequest request
    ) {
        try {
            // Input validation
            if (request == null || request.getRecordIds() == null || request.getRecordIds().isEmpty()) {
                return ApiResponse.error(400, "Record IDs cannot be empty");
            }
            if (request.getRecordIds().size() > 500) {
                return ApiResponse.error(400, "Cannot update more than 500 records at once");
            }
            if (request.getStatus() == null || request.getStatus().trim().isEmpty()) {
                return ApiResponse.error(400, "Status cannot be empty");
            }

            // Validate status value
            String status = request.getStatus().toLowerCase();
            if (!status.matches("^(mastered|reviewing|unreveiwed)$")) {
                return ApiResponse.error(400, "Invalid status. Must be: mastered, reviewing, or unreveiwed");
            }

            Long userId = jwtUtils.getUserIdFromToken(extractToken(token));
            if (userId == null || userId <= 0) {
                return ApiResponse.error(401, "Invalid authentication token");
            }

            int updated = wrongAnswerService.batchUpdateStatus(userId, request.getRecordIds(), status);
            return ApiResponse.success(
                new BatchOperationResult("status_update", updated, request.getRecordIds().size()),
                "Batch status update completed"
            );
        } catch (Exception e) {
            return ApiResponse.error(500, "Failed to batch update status: " + e.getMessage());
        }
    }

    /**
     * Batch add tags to multiple wrong answers
     */
    @PostMapping("/batch/add-tags")
    public ApiResponse<BatchOperationResult> batchAddTags(
        @RequestHeader("Authorization") String token,
        @RequestBody BatchTagsRequest request
    ) {
        try {
            Long userId = jwtUtils.getUserIdFromToken(extractToken(token));
            int updated = wrongAnswerService.batchAddTags(userId, request.getRecordIds(), request.getTags());
            return ApiResponse.success(
                new BatchOperationResult("add_tags", updated, request.getRecordIds().size()),
                "Batch add tags completed"
            );
        } catch (Exception e) {
            return ApiResponse.error(400, "Failed to batch add tags: " + e.getMessage());
        }
    }

    /**
     * Batch remove tags from multiple wrong answers
     */
    @PostMapping("/batch/remove-tags")
    public ApiResponse<BatchOperationResult> batchRemoveTags(
        @RequestHeader("Authorization") String token,
        @RequestBody BatchTagsRequest request
    ) {
        try {
            Long userId = jwtUtils.getUserIdFromToken(extractToken(token));
            int updated = wrongAnswerService.batchRemoveTags(userId, request.getRecordIds(), request.getTags());
            return ApiResponse.success(
                new BatchOperationResult("remove_tags", updated, request.getRecordIds().size()),
                "Batch remove tags completed"
            );
        } catch (Exception e) {
            return ApiResponse.error(400, "Failed to batch remove tags: " + e.getMessage());
        }
    }

    /**
     * Batch delete multiple wrong answers
     */
    @PostMapping("/batch/delete")
    public ApiResponse<BatchOperationResult> batchDelete(
        @RequestHeader("Authorization") String token,
        @RequestBody BatchDeleteRequest request
    ) {
        try {
            // Input validation
            if (request == null || request.getRecordIds() == null || request.getRecordIds().isEmpty()) {
                return ApiResponse.error(400, "Record IDs cannot be empty");
            }
            if (request.getRecordIds().size() > 1000) {
                return ApiResponse.error(400, "Cannot delete more than 1000 records at once");
            }

            Long userId = jwtUtils.getUserIdFromToken(extractToken(token));
            if (userId == null || userId <= 0) {
                return ApiResponse.error(401, "Invalid authentication token");
            }

            int deleted = wrongAnswerService.batchDelete(userId, request.getRecordIds());
            return ApiResponse.success(
                new BatchOperationResult("delete", deleted, request.getRecordIds().size()),
                "Batch delete completed"
            );
        } catch (Exception e) {
            return ApiResponse.error(500, "Failed to batch delete: " + e.getMessage());
        }
    }

    /**
     * Get analytics data for wrong answers
     */
    @GetMapping("/analytics")
    public ApiResponse<AnalyticsData> getAnalytics(
        @RequestHeader("Authorization") String token,
        @RequestParam(required = false) Integer days
    ) {
        try {
            Long userId = jwtUtils.getUserIdFromToken(extractToken(token));
            int queryDays = days != null ? days : 30;
            AnalyticsData analytics = wrongAnswerService.getAnalytics(userId, queryDays);
            return ApiResponse.success(analytics, "Analytics data retrieved successfully");
        } catch (Exception e) {
            return ApiResponse.error(400, "Failed to retrieve analytics: " + e.getMessage());
        }
    }

    // Inner classes for request bodies
    public static class NotesUpdateRequest {
        private String notes;

        public NotesUpdateRequest() {}

        public String getNotes() {
            return notes;
        }

        public void setNotes(String notes) {
            this.notes = notes;
        }
    }

    public static class TagsUpdateRequest {
        private List<String> tags;

        public TagsUpdateRequest() {}

        public List<String> getTags() {
            return tags;
        }

        public void setTags(List<String> tags) {
            this.tags = tags;
        }
    }

    public static class BatchStatusUpdateRequest {
        private List<Long> recordIds;
        private String status;

        public BatchStatusUpdateRequest() {}

        public List<Long> getRecordIds() {
            return recordIds;
        }

        public void setRecordIds(List<Long> recordIds) {
            this.recordIds = recordIds;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }

    public static class BatchTagsRequest {
        private List<Long> recordIds;
        private List<String> tags;

        public BatchTagsRequest() {}

        public List<Long> getRecordIds() {
            return recordIds;
        }

        public void setRecordIds(List<Long> recordIds) {
            this.recordIds = recordIds;
        }

        public List<String> getTags() {
            return tags;
        }

        public void setTags(List<String> tags) {
            this.tags = tags;
        }
    }

    public static class BatchDeleteRequest {
        private List<Long> recordIds;

        public BatchDeleteRequest() {}

        public List<Long> getRecordIds() {
            return recordIds;
        }

        public void setRecordIds(List<Long> recordIds) {
            this.recordIds = recordIds;
        }
    }

    public static class BatchOperationResult {
        private String operation;
        private int successCount;
        private int totalCount;

        public BatchOperationResult() {}

        public BatchOperationResult(String operation, int successCount, int totalCount) {
            this.operation = operation;
            this.successCount = successCount;
            this.totalCount = totalCount;
        }

        public String getOperation() {
            return operation;
        }

        public void setOperation(String operation) {
            this.operation = operation;
        }

        public int getSuccessCount() {
            return successCount;
        }

        public void setSuccessCount(int successCount) {
            this.successCount = successCount;
        }

        public int getTotalCount() {
            return totalCount;
        }

        public void setTotalCount(int totalCount) {
            this.totalCount = totalCount;
        }
    }

    // ===== Batch Export =====
    @PostMapping("/batch/export-csv")
    public ResponseEntity<byte[]> batchExportCsv(
        @RequestHeader("Authorization") String token,
        @RequestBody BatchExportRequest request
    ) {
        Long userId = jwtUtils.getUserIdFromToken(extractToken(token));
        List<WrongAnswerDto> records = wrongAnswerService.getWrongAnswers(userId);
        List<Long> ids = request != null ? request.getRecordIds() : null;
        if (ids != null && !ids.isEmpty()) {
            records = records.stream().filter(r -> ids.contains(r.getId())).toList();
        }
        String csv = toCsv(records, true);
        byte[] bytes = addUtf8Bom(csv).getBytes(java.nio.charset.StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=wrong-answers.csv");
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=utf-8"));
        headers.setContentLength(bytes.length);
        return ResponseEntity.ok().headers(headers).body(bytes);
    }

    @PostMapping("/batch/export-excel")
    public ResponseEntity<byte[]> batchExportExcel(
        @RequestHeader("Authorization") String token,
        @RequestBody BatchExportRequest request
    ) {
        // Use CSV for Excel compatibility
        return batchExportCsv(token, request);
    }

    public static class BatchExportRequest {
        private List<Long> recordIds;
        public BatchExportRequest() {}
        public List<Long> getRecordIds() { return recordIds; }
        public void setRecordIds(List<Long> recordIds) { this.recordIds = recordIds; }
    }

    private String toCsv(List<WrongAnswerDto> list, boolean withHeader) {
        String[] headers = new String[]{
            "id","source","difficulty","reviewStatus","wrongCount","correctCount",
            "nextReviewTime","questionTitle","userNotes","userTags"
        };
        StringBuilder sb = new StringBuilder();
        if (withHeader) {
            sb.append(String.join(",", headers)).append("\n");
        }
        for (WrongAnswerDto r : list) {
            String[] row = new String[]{
                s(r.getId()), s(r.getSource()), s(r.getDifficulty()), s(r.getReviewStatus()), s(r.getWrongCount()), s(r.getCorrectCount()),
                s(r.getNextReviewTime()), csvSafe(r.getQuestionTitle()), csvSafe(r.getUserNotes()), csvSafe(listToString(r.getUserTags()))
            };
            sb.append(String.join(",", row)).append("\n");
        }
        return sb.toString();
    }

    private String listToString(java.util.List<String> list) {
        if (list == null || list.isEmpty()) return "";
        return String.join("|", list);
    }

    private String s(Object o) { return o == null ? "" : o.toString(); }

    private String csvSafe(String s) {
        if (s == null) return "";
        boolean needQuote = s.contains(",") || s.contains("\"") || s.contains("\n");
        String v = s.replace("\"", "\"\"");
        return needQuote ? "\"" + v + "\"" : v;
    }

    private String addUtf8Bom(String s) {
        // Excel-friendly UTF-8 BOM
        return "\uFEFF" + (s == null ? "" : s);
    }
    public static class ReviewRequest {
        private String result; // pass/fail/doubt
        private Integer timeSpentSec;
        private String notes;

        public ReviewRequest() {}

        public String getResult() { return result; }
        public void setResult(String result) { this.result = result; }

        public Integer getTimeSpentSec() { return timeSpentSec; }
        public void setTimeSpentSec(Integer timeSpentSec) { this.timeSpentSec = timeSpentSec; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class AnalyticsData {
        private int totalWrongAnswers;
        private int masteredCount;
        private int reviewingCount;
        private int unreviewedCount;
        private double masteryRate;
        private int weeklyReviewCount;
        private double avgTimePerQuestion;
        private java.util.Map<String, Integer> sourceDistribution;
        private java.util.Map<String, Integer> difficultyDistribution;

        public AnalyticsData() {}

        // Getters and setters
        public int getTotalWrongAnswers() {
            return totalWrongAnswers;
        }

        public void setTotalWrongAnswers(int totalWrongAnswers) {
            this.totalWrongAnswers = totalWrongAnswers;
        }

        public int getMasteredCount() {
            return masteredCount;
        }

        public void setMasteredCount(int masteredCount) {
            this.masteredCount = masteredCount;
        }

        public int getReviewingCount() {
            return reviewingCount;
        }

        public void setReviewingCount(int reviewingCount) {
            this.reviewingCount = reviewingCount;
        }

        public int getUnreviewedCount() {
            return unreviewedCount;
        }

        public void setUnreviewedCount(int unreviewedCount) {
            this.unreviewedCount = unreviewedCount;
        }

        public double getMasteryRate() {
            return masteryRate;
        }

        public void setMasteryRate(double masteryRate) {
            this.masteryRate = masteryRate;
        }

        public int getWeeklyReviewCount() {
            return weeklyReviewCount;
        }

        public void setWeeklyReviewCount(int weeklyReviewCount) {
            this.weeklyReviewCount = weeklyReviewCount;
        }

        public double getAvgTimePerQuestion() {
            return avgTimePerQuestion;
        }

        public void setAvgTimePerQuestion(double avgTimePerQuestion) {
            this.avgTimePerQuestion = avgTimePerQuestion;
        }

        public java.util.Map<String, Integer> getSourceDistribution() {
            return sourceDistribution;
        }

        public void setSourceDistribution(java.util.Map<String, Integer> sourceDistribution) {
            this.sourceDistribution = sourceDistribution;
        }

        public java.util.Map<String, Integer> getDifficultyDistribution() {
            return difficultyDistribution;
        }

        public void setDifficultyDistribution(java.util.Map<String, Integer> difficultyDistribution) {
            this.difficultyDistribution = difficultyDistribution;
        }
    }

    private String extractToken(String authorization) {
        if (authorization == null || authorization.isBlank()) {
            throw new IllegalArgumentException("Missing authorization header");
        }
        return authorization.startsWith("Bearer ") ? authorization.substring(7) : authorization;
    }

    private java.time.LocalDateTime parseDateTime(String input) {
        if (input == null || input.isBlank()) return null;
        try {
            return java.time.LocalDateTime.parse(input);
        } catch (Exception e) {
            return null;
        }
    }
}
