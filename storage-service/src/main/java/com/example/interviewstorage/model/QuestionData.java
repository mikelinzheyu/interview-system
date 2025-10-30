package com.example.interviewstorage.model;

public class QuestionData {

    private String id;
    private String question;
    private boolean hasAnswer; // 对应JSON中的 "hasAnswer": false [cite: 106]
    private String answer;

    // --- Getters and Setters ---
    // 您可以使用IDE (like IntelliJ) 自动生成下面的代码
    // (在代码区域右键 -> Generate... -> Getter and Setter -> 全选)

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public boolean isHasAnswer() {
        return hasAnswer;
    }

    public void setHasAnswer(boolean hasAnswer) {
        this.hasAnswer = hasAnswer;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }
}