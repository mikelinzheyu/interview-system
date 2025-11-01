package com.interview.service.impl;

import com.interview.service.SpacedRepetitionService;
import com.interview.entity.WrongAnswerRecord;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SpacedRepetitionServiceImpl implements SpacedRepetitionService {
    private static final int INITIAL_INTERVAL = 1;
    private static final Map<String, Double> DIFFICULTY_MULTIPLIERS = Map.of(
        "easy", 2.6, "normal", 1.3, "hard", 1.0, "forgotten", 0.5
    );

    public LocalDateTime calculateNextReviewTime(WrongAnswerRecord record, String difficulty) {
        long intervalDays = calculateIntervalDays(
            record.getIntervalDays() != null ? record.getIntervalDays() : INITIAL_INTERVAL,
            difficulty
        );
        return LocalDateTime.now().plus(intervalDays, ChronoUnit.DAYS);
    }

    public long calculateIntervalDays(long currentInterval, String difficulty) {
        Double multiplier = DIFFICULTY_MULTIPLIERS.getOrDefault(difficulty, 1.3);
        return Math.max(1, Math.round(currentInterval * multiplier));
    }

    public int calculatePriority(WrongAnswerRecord record) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime nextReview = record.getNextReviewTime();
        long daysOverdue = Math.max(0, ChronoUnit.DAYS.between(nextReview, now));

        int overdueScore = (int) (daysOverdue * 100);
        int wrongCountScore = (record.getWrongCount() != null ? record.getWrongCount() : 0) * 50;
        int difficultyScore = getDifficultyScore(record.getDifficulty()) * 30;
        int correctCountScore = Math.max(0, (record.getCorrectCount() != null ? record.getCorrectCount() : 0) * -10);

        int totalScore = overdueScore + wrongCountScore + difficultyScore + correctCountScore;
        return Math.max(0, totalScore);
    }

    private int getDifficultyScore(String difficulty) {
        return switch (difficulty) {
            case "easy" -> 2;
            case "medium" -> 5;
            case "hard" -> 10;
            default -> 5;
        };
    }

    public int calculateMasteryScore(WrongAnswerRecord record) {
        Integer correctCount = record.getCorrectCount() != null ? record.getCorrectCount() : 0;
        Integer wrongCount = record.getWrongCount() != null ? record.getWrongCount() : 0;
        int total = correctCount + wrongCount;

        if (total == 0) return 0;
        return Math.round((correctCount * 100.0f) / total);
    }

    public String getMasteryStatus(int masteryScore) {
        if (masteryScore >= 85) return "mastered";
        if (masteryScore >= 60) return "reviewing";
        return "unreveiwed";
    }

    public List<WrongAnswerRecord> getDueForReview(List<WrongAnswerRecord> records) {
        LocalDateTime now = LocalDateTime.now();
        return records.stream()
            .filter(record -> record.getNextReviewTime() != null && !record.getNextReviewTime().isAfter(now))
            .collect(Collectors.toList());
    }

    public List<WrongAnswerRecord> sortByPriority(List<WrongAnswerRecord> records) {
        return records.stream()
            .sorted((a, b) -> calculatePriority(b) - calculatePriority(a))
            .collect(Collectors.toList());
    }

    public Map<String, Object> generateStatistics(List<WrongAnswerRecord> records) {
        Map<String, Object> stats = new HashMap<>();
        if (records == null || records.isEmpty()) return stats;

        int mastered = 0, reviewing = 0, unreveiwed = 0, nextReviewCount = 0, overdueCount = 0;
        int totalPriority = 0, totalMastery = 0;

        for (WrongAnswerRecord record : records) {
            int mastery = calculateMasteryScore(record);
            String status = getMasteryStatus(mastery);
            int priority = calculatePriority(record);

            switch (status) {
                case "mastered" -> mastered++;
                case "reviewing" -> reviewing++;
                case "unreveiwed" -> unreveiwed++;
            }

            totalMastery += mastery;
            totalPriority += priority;

            if (record.getNextReviewTime() != null && !record.getNextReviewTime().isAfter(LocalDateTime.now()))
                nextReviewCount++;
            if (priority >= 200) overdueCount++;
        }

        stats.put("total", records.size());
        stats.put("mastered", mastered);
        stats.put("reviewing", reviewing);
        stats.put("unreveiwed", unreveiwed);
        stats.put("masteredPercentage", Math.round((mastered * 100.0) / records.size()));
        stats.put("averagePriority", Math.round((totalPriority * 1.0) / records.size()));
        stats.put("averageMastery", Math.round((totalMastery * 1.0) / records.size()));
        stats.put("nextReviewCount", nextReviewCount);
        stats.put("overdueCount", overdueCount);

        return stats;
    }

    public int getRecommendedDailyCount(Map<String, Object> stats, double hoursPerDay) {
        int total = ((Number) stats.getOrDefault("total", 0)).intValue();
        if (total == 0) return 10;
        
        int baseCount = (int) (hoursPerDay * 60 / 2);
        int overdueCount = ((Number) stats.getOrDefault("overdueCount", 0)).intValue();
        double overdueRatio = (overdueCount * 1.0) / total;

        return overdueRatio > 0.2 ? (int)(baseCount * 1.5) : overdueRatio > 0.1 ? (int)(baseCount * 1.2) : baseCount;
    }
}
