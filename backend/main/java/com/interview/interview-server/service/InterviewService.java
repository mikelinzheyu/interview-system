package com.interview.service;

import com.interview.dto.PageResponse;
import com.interview.entity.InterviewSession;
import com.interview.entity.InterviewDialogue;

import java.util.List;
import java.util.Map;

public interface InterviewService {

    InterviewSession createSession(Long userId, Map<String, Object> sessionConfig);

    InterviewSession startSession(Long sessionId);

    Map<String, Object> sendMessage(Long sessionId, String content, String type);

    InterviewSession getSessionById(Long sessionId);

    InterviewSession endSession(Long sessionId);

    PageResponse<InterviewSession> getUserSessions(Long userId, int page, int size,
                                                  String status, Long categoryId);

    List<InterviewDialogue> getSessionDialogues(Long sessionId);
}