package com.example.interviewstorage.controller;

import com.example.interviewstorage.model.SessionData;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sessions")
@CrossOrigin(origins = "*")
public class SessionController {

    private static final Logger logger = LoggerFactory.getLogger(SessionController.class);
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final RedisTemplate<String, Object> redisTemplate;
    private static final String SESSION_PREFIX = "interview:session:";
    private static final long SESSION_EXPIRE_HOURS = 24;

    public SessionController(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * ??? 1: ??????
     * POST /api/sessions
     * POST /api/sessions/create (alias)
     */
    @PostMapping({"", "/create"})
    public ResponseEntity<Map<String, Object>> createSession(@RequestBody Map<String, Object> requestData) {
        try {
            String rawSessionId = stringValue(requestData, "sessionId", "session_id");
            String sessionId = StringUtils.hasText(rawSessionId) ? rawSessionId : UUID.randomUUID().toString();

            String jobTitle = stringValue(requestData, "jobTitle", "job_title");
            String status = stringValue(requestData, "status");
            if (!StringUtils.hasText(status)) {
                status = "questions_generated";
            }

            List<Map<String, Object>> questions = normalizeQuestions(requestData, jobTitle);
            if (questions.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "No valid questions provided in request payload."));
            }

            String createdAt = stringValue(requestData, "createdAt");
            if (!StringUtils.hasText(createdAt)) {
                createdAt = Instant.now().toString();
            }

            SessionData sessionData = new SessionData();
            sessionData.setSessionId(sessionId);
            sessionData.setJobTitle(jobTitle);
            sessionData.setQuestions(questions);
            sessionData.setStatus(status);
            sessionData.setCreatedAt(createdAt);
            sessionData.setUpdatedAt(createdAt);
            sessionData.setMetadata(extractMetadata(requestData));

            persistSession(sessionData);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("sessionId", sessionId);
            response.put("jobTitle", jobTitle);
            response.put("message", "Session created successfully");
            response.put("questionCount", questions.size());
            response.put("questionIds", questions.stream()
                    .map(q -> q.get("id"))
                    .collect(Collectors.toList()));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to create session", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create session: " + e.getMessage()));
        }
    }

    /**
     * List sessions (minimal info)
     * GET /api/sessions?limit=50
     */
    @GetMapping("")
    public ResponseEntity<List<Map<String, Object>>> listSessions(@RequestParam(value = "limit", required = false, defaultValue = "50") int limit) {
        try {
            Set<String> keys = redisTemplate.keys(SESSION_PREFIX + "*");
            if (keys == null || keys.isEmpty()) {
                return ResponseEntity.ok(Collections.emptyList());
            }

            List<Object> rawList = redisTemplate.opsForValue().multiGet(keys.stream().limit(limit * 2L).collect(Collectors.toList()));
            if (rawList == null) {
                return ResponseEntity.ok(Collections.emptyList());
            }

            List<Map<String, Object>> sessions = new ArrayList<>();
            for (Object raw : rawList) {
                if (raw instanceof SessionData s) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("sessionId", s.getSessionId());
                    item.put("jobTitle", s.getJobTitle());
                    item.put("status", s.getStatus());
                    item.put("createdAt", s.getCreatedAt());
                    item.put("updatedAt", s.getUpdatedAt());
                    item.put("questionCount", s.getQuestions() == null ? 0 : s.getQuestions().size());
                    sessions.add(item);
                }
            }

            // Sort by updatedAt desc
            sessions.sort((a, b) -> String.valueOf(b.getOrDefault("updatedAt", "")).compareTo(String.valueOf(a.getOrDefault("updatedAt", ""))));
            if (sessions.size() > limit) {
                sessions = sessions.subList(0, limit);
            }
            return ResponseEntity.ok(sessions);
        } catch (Exception e) {
            logger.error("Failed to list sessions", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.emptyList());
        }
    }

    /**
     * Save session (alias for POST /api/sessions)
     * POST /api/sessions/save
     */
    @PostMapping("/save")
    public ResponseEntity<Map<String, Object>> saveSession(@RequestBody Map<String, Object> requestData) {
        return createSession(requestData);
    }

    /**
     * ??? 2: ??????
     * PUT /api/sessions/{sessionId}/questions/{questionId}
     */
    @PutMapping("/{sessionId}/questions/{questionId}")
    public ResponseEntity<Map<String, Object>> updateQuestionAnswer(
            @PathVariable String sessionId,
            @PathVariable String questionId,
            @RequestBody Map<String, Object> requestData) {
        try {
            SessionData sessionData = fetchSession(sessionId);
            if (sessionData == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Session not found: " + sessionId));
            }

            String answer = stringValue(requestData, "answer", "standardAnswer", "standard_answer");
            if (!StringUtils.hasText(answer)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Missing required field: answer"));
            }

            Boolean hasAnswer = boolValue(requestData, "hasAnswer", "has_answer");
            if (hasAnswer == null) {
                hasAnswer = Boolean.TRUE;
            }

            String questionText = stringValue(requestData, "question", "question_text");

            List<Map<String, Object>> questions = sessionData.getQuestions();
            boolean updated = false;
            Instant now = Instant.now();

            for (Map<String, Object> question : questions) {
                String currentId = stringValue(question, "id");
                String currentText = stringValue(question, "question");
                if (questionId.equals(currentId)
                        || (StringUtils.hasText(questionText) && questionText.equals(currentText))) {
                    question.put("answer", answer);
                    question.put("hasAnswer", hasAnswer);
                    question.put("updatedAt", now.toString());
                    updated = true;
                    break;
                }
            }

            if (!updated) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Question not found: " + questionId));
            }

            sessionData.setQuestions(questions);
            sessionData.setUpdatedAt(now.toString());
            persistSession(sessionData);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("sessionId", sessionId);
            response.put("questionId", questionId);
            response.put("answer", answer);
            response.put("hasAnswer", hasAnswer);
            response.put("message", "Answer updated successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to update answer for session {} question {}", sessionId, questionId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update answer: " + e.getMessage()));
        }
    }

    /**
     * ????????????
     * GET /api/sessions/{sessionId}/questions/{questionId}
     */
    @GetMapping("/{sessionId}/questions/{questionId}")
    public ResponseEntity<Map<String, Object>> getQuestionWithAnswer(
            @PathVariable String sessionId,
            @PathVariable String questionId) {
        try {
            SessionData sessionData = fetchSession(sessionId);
            if (sessionData == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Session not found: " + sessionId));
            }

            Map<String, Object> question = findQuestion(sessionData.getQuestions(), questionId, null);
            if (question == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Question not found: " + questionId));
            }

            Map<String, Object> response = buildQuestionResponse(question, sessionData.getJobTitle(), sessionId, sessionData.getStatus());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to get question {} for session {}", questionId, sessionId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to get question: " + e.getMessage()));
        }
    }

    /**
     * ???????????????
     * GET /api/sessions/{sessionId}
     */
    @GetMapping("/{sessionId}")
    public ResponseEntity<Map<String, Object>> getSession(
            @PathVariable String sessionId,
            @RequestParam(value = "question", required = false) String questionText,
            @RequestParam(value = "questionId", required = false) String questionId) {

        try {
            SessionData sessionData = fetchSession(sessionId);
            if (sessionData == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Session not found: " + sessionId));
            }

            if (StringUtils.hasText(questionText) || StringUtils.hasText(questionId)) {
                Map<String, Object> question = findQuestion(sessionData.getQuestions(), questionId, questionText);
                if (question == null) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(Map.of("error", "Question not found in session: " + sessionId));
                }
                Map<String, Object> response = buildQuestionResponse(question, sessionData.getJobTitle(), sessionId, sessionData.getStatus());
                return ResponseEntity.ok(response);
            }

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("sessionId", sessionData.getSessionId());
            response.put("jobTitle", sessionData.getJobTitle());
            response.put("status", sessionData.getStatus());
            response.put("createdAt", sessionData.getCreatedAt());
            response.put("updatedAt", sessionData.getUpdatedAt());
            response.put("questions", sessionData.getQuestions());

            if (sessionData.getMetadata() != null && !sessionData.getMetadata().isEmpty()) {
                response.put("metadata", sessionData.getMetadata());
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to get session {}", sessionId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to get session: " + e.getMessage()));
        }
    }

    /**
     * ?????????????????
     * DELETE /api/sessions/{sessionId}
     */
    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Map<String, Object>> deleteSession(@PathVariable String sessionId) {
        try {
            String key = buildRedisKey(sessionId);
            Boolean deleted = redisTemplate.delete(key);

            if (Boolean.TRUE.equals(deleted)) {
                return ResponseEntity.ok(Map.of(
                        "message", "Session deleted successfully",
                        "sessionId", sessionId
                ));
            }

            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Session not found: " + sessionId));
        } catch (Exception e) {
            logger.error("Failed to delete session {}", sessionId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete session: " + e.getMessage()));
        }
    }

    private void persistSession(SessionData sessionData) {
        String key = buildRedisKey(sessionData.getSessionId());
        redisTemplate.opsForValue().set(key, sessionData, SESSION_EXPIRE_HOURS, TimeUnit.HOURS);
    }

    private SessionData fetchSession(String sessionId) {
        String key = buildRedisKey(sessionId);
        Object raw = redisTemplate.opsForValue().get(key);
        if (raw instanceof SessionData data) {
            return data;
        }
        return null;
    }

    private String buildRedisKey(String sessionId) {
        return SESSION_PREFIX + sessionId;
    }

    private Map<String, Object> buildQuestionResponse(Map<String, Object> question, String jobTitle, String sessionId, String status) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", question.get("id"));
        response.put("question", question.get("question"));
        response.put("answer", question.get("answer"));
        response.put("hasAnswer", question.getOrDefault("hasAnswer", Boolean.FALSE));
        response.put("jobTitle", jobTitle);
        response.put("sessionId", sessionId);
        response.put("status", status);

        if (question.containsKey("metadata")) {
            response.put("metadata", question.get("metadata"));
        }
        if (question.containsKey("order")) {
            response.put("order", question.get("order"));
        }
        if (question.containsKey("updatedAt")) {
            response.put("updatedAt", question.get("updatedAt"));
        }
        return response;
    }

    private List<Map<String, Object>> normalizeQuestions(Map<String, Object> requestData, String defaultJobTitle) {
        Object rawQuestions = firstNonNull(
                requestData.get("questions"),
                requestData.get("qaData"),
                requestData.get("qa_data"),
                requestData.get("questionList"),
                requestData.get("question_list")
        );

        List<Map<String, Object>> result = new ArrayList<>();
        if (rawQuestions == null) {
            return result;
        }

        List<?> candidates = convertToList(rawQuestions);
        int index = 0;
        for (Object candidate : candidates) {
            Map<String, Object> normalized = normalizeQuestion(candidate, ++index, defaultJobTitle);
            if (normalized != null) {
                result.add(normalized);
            }
        }
        return result;
    }

    private Map<String, Object> normalizeQuestion(Object item, int index, String defaultJobTitle) {
        Map<String, Object> source = convertToMap(item);
        if (source == null || source.isEmpty()) {
            return null;
        }

        String questionText = stringValue(source, "question", "question_text", "text");
        if (!StringUtils.hasText(questionText)) {
            if (item instanceof String str && StringUtils.hasText(str)) {
                questionText = str.trim();
            } else {
                logger.warn("Skipping question at index {} because question text is missing", index);
                return null;
            }
        }

        String questionId = stringValue(source, "id", "questionId", "question_id");
        if (!StringUtils.hasText(questionId)) {
            questionId = "q" + index;
        }

        String answer = stringValue(source, "answer", "standard_answer", "expected_answer", "standardAnswer");
        Boolean hasAnswer = boolValue(source, "hasAnswer", "has_answer");
        if (hasAnswer == null) {
            hasAnswer = StringUtils.hasText(answer);
        }

        Map<String, Object> normalized = new LinkedHashMap<>();
        normalized.put("id", questionId);
        normalized.put("question", questionText);
        normalized.put("answer", answer);
        normalized.put("hasAnswer", hasAnswer);
        normalized.put("order", index);
        normalized.put("createdAt", Instant.now().toString());

        String jobTitle = stringValue(source, "jobTitle", "job_title");
        if (!StringUtils.hasText(jobTitle)) {
            jobTitle = defaultJobTitle;
        }
        if (StringUtils.hasText(jobTitle)) {
            normalized.put("jobTitle", jobTitle);
        }

        Map<String, Object> extras = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : source.entrySet()) {
            String key = entry.getKey();
            if (!StringUtils.hasText(key)) {
                continue;
            }
            if (Set.of(
                    "id", "questionId", "question_id",
                    "question", "question_text", "text",
                    "answer", "standard_answer", "expected_answer", "standardAnswer",
                    "hasAnswer", "has_answer",
                    "jobTitle", "job_title"
            ).contains(key)) {
                continue;
            }
            extras.put(key, entry.getValue());
        }

        if (!extras.isEmpty()) {
            normalized.put("metadata", extras);
        }

        return normalized;
    }

    private Map<String, Object> findQuestion(List<Map<String, Object>> questions, String questionId, String questionText) {
        if (questions == null || questions.isEmpty()) {
            return null;
        }
        for (Map<String, Object> question : questions) {
            String currentId = stringValue(question, "id");
            String currentText = stringValue(question, "question");
            if (StringUtils.hasText(questionId) && questionId.equals(currentId)) {
                return question;
            }
            if (StringUtils.hasText(questionText) && questionText.equals(currentText)) {
                return question;
            }
        }
        return null;
    }

    private Map<String, Object> extractMetadata(Map<String, Object> requestData) {
        Object metadata = firstNonNull(requestData.get("metadata"), requestData.get("meta"));
        if (metadata == null) {
            return null;
        }
        Map<String, Object> map = convertToMap(metadata);
        return (map == null || map.isEmpty()) ? null : map;
    }

    private List<?> convertToList(Object value) {
        if (value instanceof List<?> list) {
            return list;
        }
        if (value instanceof String str && StringUtils.hasText(str)) {
            try {
                return OBJECT_MAPPER.readValue(str, new TypeReference<List<Object>>() {});
            } catch (JsonProcessingException e) {
                logger.warn("Failed to parse list payload from string", e);
            }
        }
        return Collections.emptyList();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> convertToMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> result = new LinkedHashMap<>();
            map.forEach((k, v) -> {
                if (k != null) {
                    result.put(String.valueOf(k), v);
                }
            });
            return result;
        }
        if (value instanceof String str && StringUtils.hasText(str)) {
            try {
                return OBJECT_MAPPER.readValue(str, new TypeReference<Map<String, Object>>() {});
            } catch (JsonProcessingException e) {
                Map<String, Object> fallback = new LinkedHashMap<>();
                fallback.put("question", str.trim());
                return fallback;
            }
        }
        return null;
    }

    private Object firstNonNull(Object... values) {
        for (Object value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private String stringValue(Map<String, Object> source, String... keys) {
        if (source == null || keys == null) {
            return null;
        }
        for (String key : keys) {
            Object value = source.get(key);
            if (value instanceof String str) {
                if (StringUtils.hasText(str)) {
                    return str.trim();
                }
            } else if (value != null) {
                String text = value.toString();
                if (StringUtils.hasText(text)) {
                    return text.trim();
                }
            }
        }
        return null;
    }

    private Boolean boolValue(Map<String, Object> source, String... keys) {
        if (source == null || keys == null) {
            return null;
        }
        for (String key : keys) {
            Object value = source.get(key);
            if (value instanceof Boolean b) {
                return b;
            }
            if (value instanceof String str && StringUtils.hasText(str)) {
                if ("true".equalsIgnoreCase(str) || "1".equals(str)) {
                    return Boolean.TRUE;
                }
                if ("false".equalsIgnoreCase(str) || "0".equals(str)) {
                    return Boolean.FALSE;
                }
            }
            if (value instanceof Number number) {
                return number.intValue() != 0;
            }
        }
        return null;
    }
}
