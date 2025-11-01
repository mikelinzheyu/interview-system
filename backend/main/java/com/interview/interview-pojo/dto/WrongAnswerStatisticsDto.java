package com.interview.dto;

import java.util.List;
import java.util.Map;

/**
 * Statistics DTO for wrong answer analysis
 */
public class WrongAnswerStatisticsDto {
    private Long userId;
    private Integer totalWrongCount; // Total number of unique wrong questions
    private Integer totalWrongAttempts; // Total number of wrong attempts
    private Integer masteredCount; // Number of mastered questions
    private Integer reviewingCount; // Number of currently reviewing
    private Integer unreviewedCount; // Number of unreviewed
    private Double masteredPercentage; // Percentage of mastered

    // By source breakdown
    private Map<String, Integer> countBySource; // e.g., {"ai_interview": 15, "question_bank": 8}

    // By difficulty breakdown
    private Map<String, Integer> countByDifficulty; // e.g., {"easy": 5, "medium": 12, "hard": 6}

    // By knowledge point (top 10)
    private List<KnowledgePointStat> knowledgePointStats;

    // Today's statistics
    private Integer todayWrongCount;
    private Integer todayReviewCount;

    public WrongAnswerStatisticsDto() {}

    public WrongAnswerStatisticsDto(Long userId) {
        this.userId = userId;
    }

    // Getters and Setters
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Integer getTotalWrongCount() {
        return totalWrongCount;
    }

    public void setTotalWrongCount(Integer totalWrongCount) {
        this.totalWrongCount = totalWrongCount;
    }

    public Integer getTotalWrongAttempts() {
        return totalWrongAttempts;
    }

    public void setTotalWrongAttempts(Integer totalWrongAttempts) {
        this.totalWrongAttempts = totalWrongAttempts;
    }

    public Integer getMasteredCount() {
        return masteredCount;
    }

    public void setMasteredCount(Integer masteredCount) {
        this.masteredCount = masteredCount;
    }

    public Integer getReviewingCount() {
        return reviewingCount;
    }

    public void setReviewingCount(Integer reviewingCount) {
        this.reviewingCount = reviewingCount;
    }

    public Integer getUnreviewedCount() {
        return unreviewedCount;
    }

    public void setUnreviewedCount(Integer unreviewedCount) {
        this.unreviewedCount = unreviewedCount;
    }

    public Double getMasteredPercentage() {
        return masteredPercentage;
    }

    public void setMasteredPercentage(Double masteredPercentage) {
        this.masteredPercentage = masteredPercentage;
    }

    public Map<String, Integer> getCountBySource() {
        return countBySource;
    }

    public void setCountBySource(Map<String, Integer> countBySource) {
        this.countBySource = countBySource;
    }

    public Map<String, Integer> getCountByDifficulty() {
        return countByDifficulty;
    }

    public void setCountByDifficulty(Map<String, Integer> countByDifficulty) {
        this.countByDifficulty = countByDifficulty;
    }

    public List<KnowledgePointStat> getKnowledgePointStats() {
        return knowledgePointStats;
    }

    public void setKnowledgePointStats(List<KnowledgePointStat> knowledgePointStats) {
        this.knowledgePointStats = knowledgePointStats;
    }

    public Integer getTodayWrongCount() {
        return todayWrongCount;
    }

    public void setTodayWrongCount(Integer todayWrongCount) {
        this.todayWrongCount = todayWrongCount;
    }

    public Integer getTodayReviewCount() {
        return todayReviewCount;
    }

    public void setTodayReviewCount(Integer todayReviewCount) {
        this.todayReviewCount = todayReviewCount;
    }

    /**
     * Inner class for knowledge point statistics
     */
    public static class KnowledgePointStat {
        private String knowledgePoint;
        private Integer wrongCount;
        private String difficulty;

        public KnowledgePointStat() {}

        public KnowledgePointStat(String knowledgePoint, Integer wrongCount, String difficulty) {
            this.knowledgePoint = knowledgePoint;
            this.wrongCount = wrongCount;
            this.difficulty = difficulty;
        }

        public String getKnowledgePoint() {
            return knowledgePoint;
        }

        public void setKnowledgePoint(String knowledgePoint) {
            this.knowledgePoint = knowledgePoint;
        }

        public Integer getWrongCount() {
            return wrongCount;
        }

        public void setWrongCount(Integer wrongCount) {
            this.wrongCount = wrongCount;
        }

        public String getDifficulty() {
            return difficulty;
        }

        public void setDifficulty(String difficulty) {
            this.difficulty = difficulty;
        }
    }
}
