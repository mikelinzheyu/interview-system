package com.interview.service;

import com.interview.dto.RecordWrongAnswerRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

/**
 * Event listener for capturing wrong answers from different sources
 * Listens to events from AI interview and question bank systems
 */
@Service
public class WrongAnswerEventListener {

    @Autowired
    private WrongAnswerService wrongAnswerService;

    /**
     * Listen to AI interview completion events
     * When user completes an AI interview, capture wrong answers
     */
    @EventListener(condition = "#event.type == 'AI_INTERVIEW_COMPLETED'")
    public void onAIInterviewCompleted(ApplicationEvent event) {
        try {
            Map<String, Object> data = (Map<String, Object>) event.getSource();
            Long userId = (Long) data.get("userId");
            Long interviewSessionId = (Long) data.get("sessionId");
            java.util.List<Map<String, Object>> wrongAnswers =
                    (java.util.List<Map<String, Object>>) data.get("wrongAnswers");

            // Process each wrong answer
            for (Map<String, Object> answer : wrongAnswers) {
                recordWrongAnswerFromInterview(userId, interviewSessionId, answer);
            }

            System.out.println("[WrongAnswerEventListener] Processed AI interview " + interviewSessionId +
                    " for user " + userId + " with " + wrongAnswers.size() + " wrong answers");
        } catch (Exception e) {
            System.err.println("[WrongAnswerEventListener] Error processing AI interview event: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Listen to question bank practice completion events
     * When user completes practice in question bank, capture wrong answers
     */
    @EventListener(condition = "#event.type == 'QUESTION_BANK_PRACTICE_COMPLETED'")
    public void onQuestionBankPracticeCompleted(ApplicationEvent event) {
        try {
            Map<String, Object> data = (Map<String, Object>) event.getSource();
            Long userId = (Long) data.get("userId");
            Long practiceSessionId = (Long) data.get("sessionId");
            java.util.List<Map<String, Object>> wrongAnswers =
                    (java.util.List<Map<String, Object>>) data.get("wrongAnswers");

            // Process each wrong answer
            for (Map<String, Object> answer : wrongAnswers) {
                recordWrongAnswerFromQuestionBank(userId, practiceSessionId, answer);
            }

            System.out.println("[WrongAnswerEventListener] Processed question bank practice " + practiceSessionId +
                    " for user " + userId + " with " + wrongAnswers.size() + " wrong answers");
        } catch (Exception e) {
            System.err.println("[WrongAnswerEventListener] Error processing question bank event: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Listen to mock exam completion events
     * When user completes a mock exam, capture wrong answers
     */
    @EventListener(condition = "#event.type == 'MOCK_EXAM_COMPLETED'")
    public void onMockExamCompleted(ApplicationEvent event) {
        try {
            Map<String, Object> data = (Map<String, Object>) event.getSource();
            Long userId = (Long) data.get("userId");
            Long examSessionId = (Long) data.get("sessionId");
            java.util.List<Map<String, Object>> wrongAnswers =
                    (java.util.List<Map<String, Object>>) data.get("wrongAnswers");

            // Process each wrong answer
            for (Map<String, Object> answer : wrongAnswers) {
                recordWrongAnswerFromMockExam(userId, examSessionId, answer);
            }

            System.out.println("[WrongAnswerEventListener] Processed mock exam " + examSessionId +
                    " for user " + userId + " with " + wrongAnswers.size() + " wrong answers");
        } catch (Exception e) {
            System.err.println("[WrongAnswerEventListener] Error processing mock exam event: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Record wrong answer from AI interview
     */
    private void recordWrongAnswerFromInterview(Long userId, Long sessionId, Map<String, Object> answerData) {
        try {
            RecordWrongAnswerRequest request = new RecordWrongAnswerRequest();
            request.setQuestionId((Long) answerData.get("questionId"));
            request.setSource("ai_interview");
            request.setSourceInstanceId(sessionId);
            request.setIsCorrect(false);
            request.setQuestionTitle((String) answerData.get("questionTitle"));
            request.setQuestionContent((String) answerData.get("questionContent"));
            request.setDifficulty((String) answerData.get("difficulty"));
            request.setKnowledgePoints((java.util.List<String>) answerData.get("knowledgePoints"));

            wrongAnswerService.recordWrongAnswer(userId, request);
        } catch (Exception e) {
            System.err.println("[WrongAnswerEventListener] Error recording interview wrong answer: " + e.getMessage());
        }
    }

    /**
     * Record wrong answer from question bank
     */
    private void recordWrongAnswerFromQuestionBank(Long userId, Long sessionId, Map<String, Object> answerData) {
        try {
            RecordWrongAnswerRequest request = new RecordWrongAnswerRequest();
            request.setQuestionId((Long) answerData.get("questionId"));
            request.setSource("question_bank");
            request.setSourceInstanceId(sessionId);
            request.setIsCorrect(false);
            request.setQuestionTitle((String) answerData.get("questionTitle"));
            request.setQuestionContent((String) answerData.get("questionContent"));
            request.setDifficulty((String) answerData.get("difficulty"));
            request.setKnowledgePoints((java.util.List<String>) answerData.get("knowledgePoints"));

            wrongAnswerService.recordWrongAnswer(userId, request);
        } catch (Exception e) {
            System.err.println("[WrongAnswerEventListener] Error recording question bank wrong answer: " + e.getMessage());
        }
    }

    /**
     * Record wrong answer from mock exam
     */
    private void recordWrongAnswerFromMockExam(Long userId, Long sessionId, Map<String, Object> answerData) {
        try {
            RecordWrongAnswerRequest request = new RecordWrongAnswerRequest();
            request.setQuestionId((Long) answerData.get("questionId"));
            request.setSource("mock_exam");
            request.setSourceInstanceId(sessionId);
            request.setIsCorrect(false);
            request.setQuestionTitle((String) answerData.get("questionTitle"));
            request.setQuestionContent((String) answerData.get("questionContent"));
            request.setDifficulty((String) answerData.get("difficulty"));
            request.setKnowledgePoints((java.util.List<String>) answerData.get("knowledgePoints"));

            wrongAnswerService.recordWrongAnswer(userId, request);
        } catch (Exception e) {
            System.err.println("[WrongAnswerEventListener] Error recording mock exam wrong answer: " + e.getMessage());
        }
    }
}
