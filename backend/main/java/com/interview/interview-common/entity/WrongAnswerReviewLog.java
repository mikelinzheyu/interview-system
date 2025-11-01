package com.interview.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

/**
 * Review log entity for wrong answer reviews
 */
public class WrongAnswerReviewLog {
    private Long id;
    private Long userId;
    private Long wrongAnswerId;
    private String result; // pass, fail, doubt
    private Integer timeSpentSec;
    private String previousStatus; // unreviewed/reviewing/mastered
    private String newStatus; // unreviewed/reviewing/mastered
    private String notes;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime reviewAt;

    public WrongAnswerReviewLog() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getWrongAnswerId() { return wrongAnswerId; }
    public void setWrongAnswerId(Long wrongAnswerId) { this.wrongAnswerId = wrongAnswerId; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public Integer getTimeSpentSec() { return timeSpentSec; }
    public void setTimeSpentSec(Integer timeSpentSec) { this.timeSpentSec = timeSpentSec; }

    public String getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(String previousStatus) { this.previousStatus = previousStatus; }

    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getReviewAt() { return reviewAt; }
    public void setReviewAt(LocalDateTime reviewAt) { this.reviewAt = reviewAt; }
}

