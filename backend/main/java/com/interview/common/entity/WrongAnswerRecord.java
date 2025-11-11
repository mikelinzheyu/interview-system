package com.interview.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Wrong Answer Record Entity - 错题记录
 * Tracks user's wrong answers from AI interviews and question bank practice
 */
public class WrongAnswerRecord {
    private Long id;
    private Long userId;
    private Long questionId;

    // Source information
    private String source; // 'ai_interview', 'question_bank', 'mock_exam', 'custom'
    private Long sourceInstanceId; // e.g., interview session ID

    // Core tracking fields
    private Integer wrongCount; // Cumulative wrong count
    private Integer correctCount; // Cumulative correct count

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime lastWrongTime; // Latest wrong answer time

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime lastCorrectTime; // Latest correct answer time

    // Review/Learning status
    private String reviewStatus; // 'unreviewed', 'reviewing', 'mastered'

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime nextReviewTime; // Next suggested review time

    private String reviewPriority; // 'high', 'medium', 'low'

    // SM-2 scheduling fields
    private Integer repetitions; // number of successful reviews in a row
    private Double easeFactor;   // EF, default 2.5, min 1.3
    private Integer intervalDays; // scheduled interval in days
    private Integer lastQuality;  // last review quality (0-5)

    // User insights
    private String userNotes; // User's error analysis notes
    private List<String> userTags; // Custom tags (e.g., "易混淆", "常考点")

    // Question metadata (denormalized for fast queries)
    private String questionTitle;
    private String questionContent;
    private String difficulty; // 'easy', 'medium', 'hard'
    private List<String> knowledgePoints;

    // Timestamps
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime updatedAt;

    // Constructors
    public WrongAnswerRecord() {}

    public WrongAnswerRecord(Long userId, Long questionId, String source) {
        this.userId = userId;
        this.questionId = questionId;
        this.source = source;
        this.wrongCount = 0;
        this.correctCount = 0;
        this.reviewStatus = "unreviewed";
        this.reviewPriority = "medium";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public Long getSourceInstanceId() {
        return sourceInstanceId;
    }

    public void setSourceInstanceId(Long sourceInstanceId) {
        this.sourceInstanceId = sourceInstanceId;
    }

    public Integer getWrongCount() {
        return wrongCount;
    }

    public void setWrongCount(Integer wrongCount) {
        this.wrongCount = wrongCount;
    }

    public Integer getCorrectCount() {
        return correctCount;
    }

    public void setCorrectCount(Integer correctCount) {
        this.correctCount = correctCount;
    }

    public LocalDateTime getLastWrongTime() {
        return lastWrongTime;
    }

    public void setLastWrongTime(LocalDateTime lastWrongTime) {
        this.lastWrongTime = lastWrongTime;
    }

    public LocalDateTime getLastCorrectTime() {
        return lastCorrectTime;
    }

    public void setLastCorrectTime(LocalDateTime lastCorrectTime) {
        this.lastCorrectTime = lastCorrectTime;
    }

    public String getReviewStatus() {
        return reviewStatus;
    }

    public void setReviewStatus(String reviewStatus) {
        this.reviewStatus = reviewStatus;
    }

    public LocalDateTime getNextReviewTime() {
        return nextReviewTime;
    }

    public void setNextReviewTime(LocalDateTime nextReviewTime) {
        this.nextReviewTime = nextReviewTime;
    }

    public String getReviewPriority() {
        return reviewPriority;
    }

    public void setReviewPriority(String reviewPriority) {
        this.reviewPriority = reviewPriority;
    }

    public Integer getRepetitions() {
        return repetitions;
    }

    public void setRepetitions(Integer repetitions) {
        this.repetitions = repetitions;
    }

    public Double getEaseFactor() {
        return easeFactor;
    }

    public void setEaseFactor(Double easeFactor) {
        this.easeFactor = easeFactor;
    }

    public Integer getIntervalDays() {
        return intervalDays;
    }

    public void setIntervalDays(Integer intervalDays) {
        this.intervalDays = intervalDays;
    }

    public Integer getLastQuality() {
        return lastQuality;
    }

    public void setLastQuality(Integer lastQuality) {
        this.lastQuality = lastQuality;
    }

    public String getUserNotes() {
        return userNotes;
    }

    public void setUserNotes(String userNotes) {
        this.userNotes = userNotes;
    }

    public List<String> getUserTags() {
        return userTags;
    }

    public void setUserTags(List<String> userTags) {
        this.userTags = userTags;
    }

    public String getQuestionTitle() {
        return questionTitle;
    }

    public void setQuestionTitle(String questionTitle) {
        this.questionTitle = questionTitle;
    }

    public String getQuestionContent() {
        return questionContent;
    }

    public void setQuestionContent(String questionContent) {
        this.questionContent = questionContent;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public List<String> getKnowledgePoints() {
        return knowledgePoints;
    }

    public void setKnowledgePoints(List<String> knowledgePoints) {
        this.knowledgePoints = knowledgePoints;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
