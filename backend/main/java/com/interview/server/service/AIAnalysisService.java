package com.interview.service;

import com.interview.entity.WrongAnswerRecord;
import java.util.List;
import java.util.Map;

public interface AIAnalysisService {
    Map<String, Object> analyzeWrongAnswer(String recordId, WrongAnswerRecord record);
    
    Map<String, Object> analyzeWrongAnswers(List<WrongAnswerRecord> records);
    
    Map<String, Object> generatePersonalizedHints(WrongAnswerRecord record, String userLearningStyle);
    
    List<String> generateLearningInsights(WrongAnswerRecord record);
    
    Map<String, Object> generateReviewPlan(WrongAnswerRecord record, Map<String, Object> constraints);
    
    Map<String, Object> getEmptyAnalysis();
}
