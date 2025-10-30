package com.example.interviewstorage.model;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

/**
 * ??????
 */
public class SessionData implements Serializable {

    private static final long serialVersionUID = 1L;

    private String sessionId;
    private String jobTitle;
    private List<Map<String, Object>> questions;
    private String status;
    private String createdAt;
    private String updatedAt;
    private Map<String, Object> metadata;

    public SessionData() {
    }

    public SessionData(String sessionId,
                       String jobTitle,
                       List<Map<String, Object>> questions,
                       String status,
                       String createdAt,
                       String updatedAt,
                       Map<String, Object> metadata) {
        this.sessionId = sessionId;
        this.jobTitle = jobTitle;
        this.questions = questions;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.metadata = metadata;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public List<Map<String, Object>> getQuestions() {
        return questions;
    }

    public void setQuestions(List<Map<String, Object>> questions) {
        this.questions = questions;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    @Override
    public String toString() {
        return "SessionData{" +
                "sessionId='" + sessionId + '\'' +
                ", jobTitle='" + jobTitle + '\'' +
                ", questions=" + questions +
                ", status='" + status + '\'' +
                ", createdAt='" + createdAt + '\'' +
                ", updatedAt='" + updatedAt + '\'' +
                ", metadata=" + metadata +
                '}';
    }
}
