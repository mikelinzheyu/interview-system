package com.interview.controller;

import com.interview.dto.ApiResponse;
import com.interview.dto.PageResponse;
import com.interview.entity.InterviewSession;
import com.interview.entity.InterviewDialogue;
import com.interview.service.InterviewService;
import com.interview.util.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/sessions")
public class InterviewController {

    @Autowired
    private InterviewService interviewService;

    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping
    public ApiResponse<InterviewSession> createSession(
            @RequestHeader("Authorization") String authorization,
            @RequestBody Map<String, Object> sessionConfig) {
        String token = authorization.substring(7);
        Long userId = jwtUtils.getUserIdFromToken(token);

        InterviewSession session = interviewService.createSession(userId, sessionConfig);
        return ApiResponse.success(session);
    }

    @PostMapping("/{id}/start")
    public ApiResponse<Map<String, Object>> startSession(@PathVariable Long id) {
        InterviewSession session = interviewService.startSession(id);

        Map<String, Object> result = Map.of(
            "session_id", session.getId(),
            "status", session.getStatus(),
            "first_question", Map.of(
                "content", "请简单介绍一下您的开发经验",
                "type", "开场白",
                "sequence", 1
            ),
            "started_at", session.getStartedAt()
        );

        return ApiResponse.success(result);
    }

    @PostMapping("/{id}/message")
    public ApiResponse<Map<String, Object>> sendMessage (@PathVariable Long id,
            @RequestBody Map<String, String> messageData) {
        String content = messageData.get("content");
        String type = messageData.get("type");

        Map<String, Object> result = interviewService.sendMessage(id, content, type);
        return ApiResponse.success(result);
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> getSession(@PathVariable Long id) {
        InterviewSession session = interviewService.getSessionById(id);
        List<InterviewDialogue> dialogues = interviewService.getSessionDialogues(id);

        Map<String, Object> result = Map.of(
            "session", session,
            "dialogues", dialogues
        );

        return ApiResponse.success(result);
    }

    @PostMapping("/{id}/end")
    public ApiResponse<Map<String, Object>> endSession(@PathVariable Long id) {
        InterviewSession session = interviewService.endSession(id);

        Map<String, Object> result = Map.of(
            "session_id", session.getId(),
            "status", session.getStatus(),
            "ended_at", session.getEndedAt(),
            "duration", session.getDuration(),
            "report_id", session.getId() // 暂时使用session_id作为report_id
        );

        return ApiResponse.success(result);
    }

    @GetMapping
    public ApiResponse<PageResponse<InterviewSession>> getSessions(
            @RequestHeader("Authorization") String authorization,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(name = "category_id", required = false) Long categoryId)
    {

        String token = authorization.substring(7);
        Long userId = jwtUtils.getUserIdFromToken(token);

        PageResponse<InterviewSession> result = interviewService.getUserSessions(
                userId, page, size, status, categoryId);
        return ApiResponse.success(result);
    }
}