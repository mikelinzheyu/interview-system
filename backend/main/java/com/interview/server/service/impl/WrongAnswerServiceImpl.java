package com.interview.service.impl;

import com.interview.dto.RecordWrongAnswerRequest;
import com.interview.dto.WrongAnswerDto;
import com.interview.dto.WrongAnswerStatisticsDto;
import com.interview.entity.WrongAnswerRecord;
import com.interview.mapper.WrongAnswerMapper;
import com.interview.mapper.WrongAnswerReviewLogMapper;
import com.interview.entity.WrongAnswerReviewLog;
import com.interview.service.WrongAnswerService;
import org.springframework.beans.BeanUtils;
import com.interview.config.WrongAnswersSchedulerConfig;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Implementation of WrongAnswerService
 */
@Service
public class WrongAnswerServiceImpl implements WrongAnswerService {

    private final WrongAnswerMapper wrongAnswerMapper;
    private final WrongAnswerReviewLogMapper reviewLogMapper;
    private final WrongAnswersSchedulerConfig schedulerConfig;

    public WrongAnswerServiceImpl(WrongAnswerMapper wrongAnswerMapper, WrongAnswerReviewLogMapper reviewLogMapper, WrongAnswersSchedulerConfig schedulerConfig) {
        this.wrongAnswerMapper = wrongAnswerMapper;
        this.reviewLogMapper = reviewLogMapper;
        this.schedulerConfig = schedulerConfig;
    }

    @Override
    public WrongAnswerDto recordWrongAnswer(Long userId, RecordWrongAnswerRequest request) {
        // Try to find existing record
        WrongAnswerRecord existing = wrongAnswerMapper.selectByUserAndQuestion(
            userId, request.getQuestionId()
        );

        WrongAnswerRecord record;
        if (existing == null) {
            // Create new record
            record = new WrongAnswerRecord(userId, request.getQuestionId(), request.getSource());
            record.setQuestionTitle(request.getQuestionTitle());
            record.setQuestionContent(request.getQuestionContent());
            record.setDifficulty(request.getDifficulty());
            record.setKnowledgePoints(request.getKnowledgePoints());
            // Initialize SM-2 scheduling defaults
            record.setRepetitions(0);
            record.setEaseFactor(2.5);
            record.setIntervalDays(0);
            record.setLastQuality(null);
        } else {
            // Update existing record
            record = existing;
        }

        // Update based on whether answer is correct
        if (request.getIsCorrect() != null && request.getIsCorrect()) {
            // User got it correct
            record.setCorrectCount((record.getCorrectCount() != null ? record.getCorrectCount() : 0) + 1);
            record.setLastCorrectTime(LocalDateTime.now());

            // Check if mastered (3 consecutive correct answers)
            if (record.getCorrectCount() >= 3) {
                record.setReviewStatus("mastered");
            } else if (!record.getReviewStatus().equals("reviewing")) {
                record.setReviewStatus("reviewing");
            }
        } else {
            // User got it wrong
            record.setWrongCount((record.getWrongCount() != null ? record.getWrongCount() : 0) + 1);
            record.setLastWrongTime(LocalDateTime.now());
            record.setReviewStatus("reviewing");
        }

        // Calculate next review time using spaced repetition algorithm
        calculateNextReviewTime(record);

        // Set priority
        updateReviewPriority(record);

        // Update timestamps
        record.setUpdatedAt(LocalDateTime.now());

        // Save to database
        if (existing == null) {
            wrongAnswerMapper.insert(record);
        } else {
            wrongAnswerMapper.updateById(record);
        }

        // Convert to DTO and return
        return convertToDto(record);
    }

    @Override
    public WrongAnswerDto markAsMastered(Long userId, Long recordId) {
        WrongAnswerRecord record = wrongAnswerMapper.selectById(recordId);
        if (record == null || !record.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Record not found or unauthorized");
        }

        record.setReviewStatus("mastered");
        record.setUpdatedAt(LocalDateTime.now());
        wrongAnswerMapper.updateById(record);

        return convertToDto(record);
    }

    @Override
    public WrongAnswerDto markAsReviewing(Long userId, Long recordId) {
        WrongAnswerRecord record = wrongAnswerMapper.selectById(recordId);
        if (record == null || !record.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Record not found or unauthorized");
        }

        record.setReviewStatus("reviewing");
        record.setUpdatedAt(LocalDateTime.now());
        wrongAnswerMapper.updateById(record);

        return convertToDto(record);
    }

    @Override
    public WrongAnswerDto getWrongAnswer(Long userId, Long recordId) {
        WrongAnswerRecord record = wrongAnswerMapper.selectById(recordId);
        if (record == null || !record.getUserId().equals(userId)) {
            return null;
        }
        return convertToDto(record);
    }

    @Override
    public List<WrongAnswerDto> getWrongAnswers(Long userId) {
        return wrongAnswerMapper.selectByUserId(userId)
            .stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<WrongAnswerDto> getWrongAnswersByStatus(Long userId, String status) {
        return wrongAnswerMapper.selectByUserIdAndStatus(userId, status)
            .stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<WrongAnswerDto> getWrongAnswersBySource(Long userId, String source) {
        return wrongAnswerMapper.selectByUserIdAndSource(userId, source)
            .stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<WrongAnswerDto> getDueForReview(Long userId) {
        return wrongAnswerMapper.selectDueForReview(userId, LocalDateTime.now())
            .stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }

    @Override
    public WrongAnswerStatisticsDto getStatistics(Long userId) {
        WrongAnswerStatisticsDto stats = new WrongAnswerStatisticsDto(userId);

        // Total counts
        stats.setTotalWrongCount(wrongAnswerMapper.countByUserId(userId));

        // By status
        stats.setMasteredCount(wrongAnswerMapper.countByUserIdAndStatus(userId, "mastered"));
        stats.setReviewingCount(wrongAnswerMapper.countByUserIdAndStatus(userId, "reviewing"));
        stats.setUnreviewedCount(wrongAnswerMapper.countByUserIdAndStatus(userId, "unreviewed"));

        // Calculate mastered percentage
        int total = stats.getTotalWrongCount();
        if (total > 0) {
            stats.setMasteredPercentage((double) stats.getMasteredCount() / total * 100);
        } else {
            stats.setMasteredPercentage(0.0);
        }

        // By source
        Map<String, Integer> countBySource = new HashMap<>();
        countBySource.put("ai_interview", wrongAnswerMapper.countByUserIdAndSource(userId, "ai_interview"));
        countBySource.put("question_bank", wrongAnswerMapper.countByUserIdAndSource(userId, "question_bank"));
        countBySource.put("mock_exam", wrongAnswerMapper.countByUserIdAndSource(userId, "mock_exam"));
        stats.setCountBySource(countBySource);

        // By difficulty
        Map<String, Integer> countByDifficulty = new HashMap<>();
        countByDifficulty.put("easy", wrongAnswerMapper.countByUserIdAndDifficulty(userId, "easy"));
        countByDifficulty.put("medium", wrongAnswerMapper.countByUserIdAndDifficulty(userId, "medium"));
        countByDifficulty.put("hard", wrongAnswerMapper.countByUserIdAndDifficulty(userId, "hard"));
        stats.setCountByDifficulty(countByDifficulty);

        // Today's counts
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfDay = now.withHour(23).withMinute(59).withSecond(59);
        stats.setTodayWrongCount(wrongAnswerMapper.countTodayByUserId(userId, startOfDay, endOfDay));

        return stats;
    }

    @Override
    public WrongAnswerDto updateUserNotes(Long userId, Long recordId, String notes) {
        WrongAnswerRecord record = wrongAnswerMapper.selectById(recordId);
        if (record == null || !record.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Record not found or unauthorized");
        }

        record.setUserNotes(notes);
        record.setUpdatedAt(LocalDateTime.now());
        wrongAnswerMapper.updateById(record);

        return convertToDto(record);
    }

    @Override
    public WrongAnswerDto updateUserTags(Long userId, Long recordId, List<String> tags) {
        WrongAnswerRecord record = wrongAnswerMapper.selectById(recordId);
        if (record == null || !record.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Record not found or unauthorized");
        }

        record.setUserTags(tags);
        record.setUpdatedAt(LocalDateTime.now());
        wrongAnswerMapper.updateById(record);

        return convertToDto(record);
    }

    @Override
    public void deleteWrongAnswer(Long userId, Long recordId) {
        WrongAnswerRecord record = wrongAnswerMapper.selectById(recordId);
        if (record == null || !record.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Record not found or unauthorized");
        }

        wrongAnswerMapper.deleteById(recordId);
    }

    @Override
    public void generateReviewPlan(Long userId) {
        // Get all non-mastered wrong answers
        List<WrongAnswerRecord> records = wrongAnswerMapper.selectByUserIdAndStatus(userId, "reviewing");
        records.addAll(wrongAnswerMapper.selectByUserIdAndStatus(userId, "unreviewed"));

        // Update next review times
        for (WrongAnswerRecord record : records) {
            calculateNextReviewTime(record);
            wrongAnswerMapper.updateById(record);
        }
    }

    @Override
    public WrongAnswerDto reviewOnce(Long userId, Long recordId, String result, Integer timeSpentSec, String notes) {
        WrongAnswerRecord record = wrongAnswerMapper.selectById(recordId);
        if (record == null || !record.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Record not found or unauthorized");
        }

        String prevStatus = record.getReviewStatus();
        LocalDateTime now = LocalDateTime.now();

        boolean pass = result != null && ("pass".equalsIgnoreCase(result) || "mastered".equalsIgnoreCase(result));

        if (pass) {
            record.setCorrectCount((record.getCorrectCount() != null ? record.getCorrectCount() : 0) + 1);
            record.setLastCorrectTime(now);
            if (record.getCorrectCount() >= 3) {
                record.setReviewStatus("mastered");
            } else if (!"reviewing".equals(record.getReviewStatus())) {
                record.setReviewStatus("reviewing");
            }
        } else {
            record.setWrongCount((record.getWrongCount() != null ? record.getWrongCount() : 0) + 1);
            record.setLastWrongTime(now);
            record.setReviewStatus("reviewing");
        }

        int quality = mapResultToQuality(result);
        String strategy = schedulerConfig.getStrategy();
        if ("ebbinghaus".equals(strategy)) {
            calculateNextReviewTime(record);
        } else if ("fsrs".equals(strategy)) {
            applySm2Scheduling(record, quality);
            // lightweight FSRS-style adjustment based on item difficulty & history
            adjustIntervalFsrs(record);
        } else {
            applySm2Scheduling(record, quality);
        }
        updateReviewPriority(record);
        record.setUpdatedAt(now);
        wrongAnswerMapper.updateById(record);

        // Write review log
        WrongAnswerReviewLog log = new WrongAnswerReviewLog();
        log.setUserId(userId);
        log.setWrongAnswerId(recordId);
        log.setReviewAt(now);
        log.setResult(pass ? "pass" : (result != null ? result.toLowerCase() : "fail"));
        log.setTimeSpentSec(timeSpentSec != null ? timeSpentSec : 0);
        log.setPreviousStatus(prevStatus);
        log.setNewStatus(record.getReviewStatus());
        log.setNotes(notes);
        reviewLogMapper.insert(log);

        return convertToDto(record);
    }

    @Override
    public java.util.List<WrongAnswerReviewLog> getReviewLogs(Long userId, Long recordId) {
        return reviewLogMapper.selectByUserAndRecord(userId, recordId);
    }

    @Override
    public com.interview.dto.PageResponse<WrongAnswerReviewLog> getReviewLogs(
        Long userId,
        Long recordId,
        String result,
        LocalDateTime from,
        LocalDateTime to,
        int page,
        int size
    ) {
        if (page < 1) page = 1;
        if (size <= 0 || size > 200) size = 20;
        int offset = (page - 1) * size;

        long total = reviewLogMapper.countByUserAndRecordFiltered(userId, recordId, result, from, to);
        java.util.List<WrongAnswerReviewLog> list = total > 0
            ? reviewLogMapper.selectByUserAndRecordFiltered(userId, recordId, result, from, to, offset, size)
            : java.util.Collections.emptyList();

        return com.interview.dto.PageResponse.of(list, page, size, total);
    }

    // Helper methods

    /**
     * Calculate next review time using Ebbinghaus spaced repetition algorithm
     * Intervals: 1 day, 3 days, 7 days, 14 days, 30 days...
     */
    private void calculateNextReviewTime(WrongAnswerRecord record) {
        if (record.getReviewStatus().equals("mastered")) {
            record.setNextReviewTime(null);
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        int daysToAdd = getIntervalDays(record.getWrongCount());
        record.setNextReviewTime(now.plusDays(daysToAdd));
    }

    /**
     * Map textual result to SM-2 quality score (0-5)
     */
    private int mapResultToQuality(String result) {
        if (result == null) return 2;
        String r = result.toLowerCase();
        if ("pass".equals(r) || "mastered".equals(r)) return 5;
        if ("doubt".equals(r) || "partial".equals(r)) return 3;
        return 1; // fail
    }

    /**
     * Apply simplified SM-2 scheduling to update nextReviewTime and related fields
     */
    private void applySm2Scheduling(WrongAnswerRecord record, int quality) {
        LocalDateTime now = LocalDateTime.now();

        Integer reps = record.getRepetitions() != null ? record.getRepetitions() : 0;
        Double ef = record.getEaseFactor() != null ? record.getEaseFactor() : 2.5;
        Integer interval = record.getIntervalDays() != null ? record.getIntervalDays() : 0;

        if (quality < 3) {
            reps = 0;
            interval = 1;
        } else {
            if (reps == 0) {
                interval = 1;
            } else if (reps == 1) {
                interval = 6;
            } else {
                interval = (int) Math.round(interval * ef);
                if (interval < 1) interval = 1;
            }
            reps = reps + 1;
        }

        // Update ease factor
        ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (ef < 1.3) ef = 1.3;

        record.setRepetitions(reps);
        record.setEaseFactor(ef);
        record.setIntervalDays(interval);
        record.setLastQuality(quality);
        record.setNextReviewTime(now.plusDays(interval));
    }

    /**
     * Lightweight FSRS-style interval adjustment as a prototype
     * Increases/decreases interval using heuristic weight from difficulty and repetitions.
     */
    private void adjustIntervalFsrs(WrongAnswerRecord record) {
        int interval = record.getIntervalDays() != null ? record.getIntervalDays() : 1;
        String difficulty = record.getDifficulty();
        int reps = record.getRepetitions() != null ? record.getRepetitions() : 0;

        double diffWeight = 1.0;
        if ("hard".equalsIgnoreCase(difficulty)) diffWeight = 0.85;
        else if ("easy".equalsIgnoreCase(difficulty)) diffWeight = 1.1;

        double repsWeight = 1.0 + Math.min(0.25, Math.log(1 + Math.max(0, reps)) / 10.0);

        double alpha = schedulerConfig.getFsrsAlpha();

        int adjusted = (int)Math.round(interval * diffWeight * repsWeight * alpha);
        if (adjusted < 1) adjusted = 1;
        record.setIntervalDays(adjusted);
        record.setNextReviewTime(java.time.LocalDateTime.now().plusDays(adjusted));
    }

    /**
     * Determine review interval based on number of wrong answers
     */
    private int getIntervalDays(Integer wrongCount) {
        if (wrongCount == null || wrongCount == 0) return 1;
        if (wrongCount == 1) return 1;
        if (wrongCount == 2) return 3;
        if (wrongCount == 3) return 7;
        if (wrongCount == 4) return 14;
        return 30; // After 5+ wrong, review in 30 days
    }

    /**
     * Update review priority based on wrong count and difficulty
     */
    private void updateReviewPriority(WrongAnswerRecord record) {
        int wrongCount = record.getWrongCount() != null ? record.getWrongCount() : 0;
        String difficulty = record.getDifficulty();

        if (wrongCount >= 3 || "hard".equals(difficulty)) {
            record.setReviewPriority("high");
        } else if (wrongCount >= 2) {
            record.setReviewPriority("medium");
        } else {
            record.setReviewPriority("low");
        }
    }

    /**
     * Convert entity to DTO
     */
    private WrongAnswerDto convertToDto(WrongAnswerRecord record) {
        WrongAnswerDto dto = new WrongAnswerDto();
        BeanUtils.copyProperties(record, dto);
        return dto;
    }

    @Override
    public int batchUpdateStatus(Long userId, List<Long> recordIds, String status) {
        int count = 0;
        for (Long recordId : recordIds) {
            try {
                if ("mastered".equals(status)) {
                    markAsMastered(userId, recordId);
                } else if ("reviewing".equals(status)) {
                    markAsReviewing(userId, recordId);
                }
                count++;
            } catch (Exception e) {
                // Continue with next record on error
                continue;
            }
        }
        return count;
    }

    @Override
    public int batchAddTags(Long userId, List<Long> recordIds, List<String> tags) {
        int count = 0;
        for (Long recordId : recordIds) {
            try {
                WrongAnswerDto current = getWrongAnswer(userId, recordId);
                if (current != null) {
                    List<String> currentTags = current.getUserTags() != null ?
                        new java.util.ArrayList<>(current.getUserTags()) : new java.util.ArrayList<>();
                    for (String tag : tags) {
                        if (!currentTags.contains(tag)) {
                            currentTags.add(tag);
                        }
                    }
                    updateUserTags(userId, recordId, currentTags);
                    count++;
                }
            } catch (Exception e) {
                continue;
            }
        }
        return count;
    }

    @Override
    public int batchRemoveTags(Long userId, List<Long> recordIds, List<String> tags) {
        int count = 0;
        for (Long recordId : recordIds) {
            try {
                WrongAnswerDto current = getWrongAnswer(userId, recordId);
                if (current != null && current.getUserTags() != null) {
                    List<String> currentTags = new java.util.ArrayList<>(current.getUserTags());
                    currentTags.removeAll(tags);
                    updateUserTags(userId, recordId, currentTags);
                    count++;
                }
            } catch (Exception e) {
                continue;
            }
        }
        return count;
    }

    @Override
    public int batchDelete(Long userId, List<Long> recordIds) {
        int count = 0;
        for (Long recordId : recordIds) {
            try {
                deleteWrongAnswer(userId, recordId);
                count++;
            } catch (Exception e) {
                continue;
            }
        }
        return count;
    }

    @Override
    public com.interview.controller.WrongAnswerController.AnalyticsData getAnalytics(Long userId, int days) {
        com.interview.controller.WrongAnswerController.AnalyticsData analytics =
            new com.interview.controller.WrongAnswerController.AnalyticsData();

        List<WrongAnswerDto> allRecords = getWrongAnswers(userId);

        // Filter records from last N days
        java.time.LocalDateTime cutoffDate = LocalDateTime.now().minusDays(days);
        List<WrongAnswerDto> recentRecords = allRecords.stream()
            .filter(r -> r.getUpdatedAt() != null && r.getUpdatedAt().isAfter(cutoffDate))
            .collect(Collectors.toList());

        // Calculate metrics
        int total = allRecords.size();
        int mastered = (int) allRecords.stream()
            .filter(r -> "mastered".equals(r.getReviewStatus())).count();
        int reviewing = (int) allRecords.stream()
            .filter(r -> "reviewing".equals(r.getReviewStatus())).count();
        int unreviewed = total - mastered - reviewing;

        analytics.setTotalWrongAnswers(total);
        analytics.setMasteredCount(mastered);
        analytics.setReviewingCount(reviewing);
        analytics.setUnreviewedCount(unreviewed);
        analytics.setMasteryRate(total > 0 ? (double) mastered / total * 100 : 0);
        analytics.setWeeklyReviewCount((int) recentRecords.stream()
            .filter(r -> r.getUpdatedAt().isAfter(LocalDateTime.now().minusDays(7))).count());

        // Calculate source distribution
        Map<String, Integer> sourceDistribution = new HashMap<>();
        allRecords.forEach(r -> {
            String source = r.getSource() != null ? r.getSource() : "unknown";
            sourceDistribution.put(source, sourceDistribution.getOrDefault(source, 0) + 1);
        });
        analytics.setSourceDistribution(sourceDistribution);

        // Calculate difficulty distribution
        Map<String, Integer> difficultyDistribution = new HashMap<>();
        allRecords.forEach(r -> {
            String difficulty = r.getDifficulty() != null ? r.getDifficulty() : "unknown";
            difficultyDistribution.put(difficulty, difficultyDistribution.getOrDefault(difficulty, 0) + 1);
        });
        analytics.setDifficultyDistribution(difficultyDistribution);

        return analytics;
    }
}
