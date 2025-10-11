package com.example.interviewstorage.controller;

import com.example.interviewstorage.model.SessionData;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public SessionController(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @PostMapping
    public ResponseEntity<?> saveSession(@RequestBody SessionData session) {
        try {
            if (session.getSessionId() == null || session.getQaData() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields: sessionId, qaData"));
            }
            session.setCreatedAt(Instant.now().toString());
            session.setUpdatedAt(Instant.now().toString());
            String key = "interview:session:" + session.getSessionId();
            String value = objectMapper.writeValueAsString(session);

            redisTemplate.opsForValue().set(key, value, Duration.ofDays(7));

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("sessionId", session.getSessionId());
            response.put("qa_count", session.getQaData().size());
            response.put("expires_in_days", 7);

            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to save session: " + e.getMessage()));
        }
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<?> getSession(@PathVariable String sessionId, @RequestParam Optional<String> question) {
        try {
            String key = "interview:session:" + sessionId;
            String sessionDataStr = redisTemplate.opsForValue().get(key);

            if (sessionDataStr == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Session not found"));
            }

            SessionData sessionData = objectMapper.readValue(sessionDataStr, SessionData.class);

            if (question.isPresent()) {
                for (Map<String, Object> qa : sessionData.getQaData()) {
                    if (Objects.equals(qa.get("question"), question.get())) {
                        Map<String, Object> response = new HashMap<>();
                        response.put("session_id", sessionId);
                        response.put("question", question.get());
                        response.put("answer", qa.get("answer"));
                        return ResponseEntity.ok(response);
                    }
                }
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Question not found in session"));
            }

            return ResponseEntity.ok(sessionData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to get session: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<?> deleteSession(@PathVariable String sessionId) {
        String key = "interview:session:" + sessionId;
        Boolean deleted = redisTemplate.delete(key);
        if (Boolean.TRUE.equals(deleted)) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Session deleted"));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Session not found"));
        }
    }
}