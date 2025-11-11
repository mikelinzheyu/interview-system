package com.interview.service;

import com.interview.dto.RecordWrongAnswerRequest;
import com.interview.dto.WrongAnswerDto;
import com.interview.dto.WrongAnswerStatisticsDto;
import com.interview.controller.WrongAnswerController.AnalyticsData;
import java.util.List;

/**
 * Service interface for wrong answer management
 */
public interface WrongAnswerService {

    /**
     * Record or update a wrong answer (upsert logic)
     * If the question hasn't been marked wrong before, create a new record
     * If it has, update the existing record with new information
     */
    WrongAnswerDto recordWrongAnswer(Long userId, RecordWrongAnswerRequest request);

    /**
     * Mark a question as mastered
     */
    WrongAnswerDto markAsMastered(Long userId, Long recordId);

    /**
     * Mark a question as reviewing
     */
    WrongAnswerDto markAsReviewing(Long userId, Long recordId);

    /**
     * Get a specific wrong answer record
     */
    WrongAnswerDto getWrongAnswer(Long userId, Long recordId);

    /**
     * Get all wrong answers for a user
     */
    List<WrongAnswerDto> getWrongAnswers(Long userId);

    /**
     * Get wrong answers by review status
     */
    List<WrongAnswerDto> getWrongAnswersByStatus(Long userId, String status);

    /**
     * Get wrong answers by source (ai_interview, question_bank, etc.)
     */
    List<WrongAnswerDto> getWrongAnswersBySource(Long userId, String source);

    /**
     * Get questions due for review
     */
    List<WrongAnswerDto> getDueForReview(Long userId);

    /**
     * Get statistics for wrong answers
     */
    WrongAnswerStatisticsDto getStatistics(Long userId);

    /**
     * Update user notes for a wrong answer
     */
    WrongAnswerDto updateUserNotes(Long userId, Long recordId, String notes);

    /**
     * Update user tags for a wrong answer
     */
    WrongAnswerDto updateUserTags(Long userId, Long recordId, List<String> tags);

    /**
     * Delete a wrong answer record
     */
    void deleteWrongAnswer(Long userId, Long recordId);

    /**
     * Generate review plan based on spaced repetition algorithm
     */
    void generateReviewPlan(Long userId);

    /**
     * Review a wrong answer once and update scheduling/logs
     */
    WrongAnswerDto reviewOnce(Long userId, Long recordId, String result, Integer timeSpentSec, String notes);

    /**
     * Get review logs for a wrong answer
     */
    java.util.List<com.interview.entity.WrongAnswerReviewLog> getReviewLogs(Long userId, Long recordId);

    /**
     * Get review logs (paged with filters)
     */
    com.interview.dto.PageResponse<com.interview.entity.WrongAnswerReviewLog> getReviewLogs(
        Long userId,
        Long recordId,
        String result,
        java.time.LocalDateTime from,
        java.time.LocalDateTime to,
        int page,
        int size
    );

    /**
     * Batch update status for multiple wrong answers
     */
    int batchUpdateStatus(Long userId, List<Long> recordIds, String status);

    /**
     * Batch add tags to multiple wrong answers
     */
    int batchAddTags(Long userId, List<Long> recordIds, List<String> tags);

    /**
     * Batch remove tags from multiple wrong answers
     */
    int batchRemoveTags(Long userId, List<Long> recordIds, List<String> tags);

    /**
     * Batch delete multiple wrong answers
     */
    int batchDelete(Long userId, List<Long> recordIds);

    /**
     * Get analytics data for wrong answers
     */
    AnalyticsData getAnalytics(Long userId, int days);
}
