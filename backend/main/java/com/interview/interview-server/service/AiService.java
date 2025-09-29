package com.interview.service;

import java.util.Map;

public interface AiService {

    String generateInterviewQuestion(String category, String difficulty, String context);

    Map<String, Object> analyzeAnswer(String question, String answer, String expectedAnswer);

    String generateFollowUpQuestion(String previousQuestion, String answer, String context);

    Map<String, Object> generateInterviewReport(Long sessionId);

    String chatWithAI(String message, String context);
}