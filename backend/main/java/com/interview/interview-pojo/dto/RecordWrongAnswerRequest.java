package com.interview.dto;

import java.util.List;

/**
 * Request DTO for recording a wrong answer
 */
public class RecordWrongAnswerRequest {
    private Long questionId;
    private String source; // 'ai_interview', 'question_bank', 'mock_exam'
    private Long sourceInstanceId; // e.g., interview session ID
    private Boolean isCorrect; // Whether the user got it correct this time
    private String userNotes; // Optional: user's error analysis
    private List<String> userTags; // Optional: custom tags

    // Question metadata (for denormalization)
    private String questionTitle;
    private String questionContent;
    private String difficulty;
    private List<String> knowledgePoints;

    public RecordWrongAnswerRequest() {}

    public RecordWrongAnswerRequest(Long questionId, String source, Boolean isCorrect) {
        this.questionId = questionId;
        this.source = source;
        this.isCorrect = isCorrect;
    }

    // Getters and Setters
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

    public Boolean getIsCorrect() {
        return isCorrect;
    }

    public void setIsCorrect(Boolean isCorrect) {
        this.isCorrect = isCorrect;
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
}
