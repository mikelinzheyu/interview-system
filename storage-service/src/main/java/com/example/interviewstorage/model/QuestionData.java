package com.example.interviewstorage.model;

import lombok.Data;
import java.io.Serializable;

@Data
public class QuestionData implements Serializable {
    private String id;
    private String question;
    private Boolean hasAnswer;
    private String answer;
}
