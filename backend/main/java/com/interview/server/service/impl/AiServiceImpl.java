package com.interview.service.impl;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONUtil;
import cn.hutool.json.JSONObject;
import com.interview.service.AiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class AiServiceImpl implements AiService {

    private static final Logger logger = LoggerFactory.getLogger(AiServiceImpl.class);

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    @Value("${ai.openai.api-key}")
    private String openAiApiKey;

    @Value("${ai.openai.base-url}")
    private String openAiBaseUrl;

    @Value("${ai.openai.model}")
    private String openAiModel;

    @Value("${ai.openai.timeout}")
    private int openAiTimeoutMs;

    @Value("${ai.dify.workflow-url:https://api.dify.ai/v1/workflows/run}")
    private String difyWorkflowUrl;

    @Value("${ai.dify.api-key:}")
    private String difyApiKey;

    @Value("${ai.dify.workflow.generate-id:rBRtFrkEqD9QuvcW}")
    private String difyGenerateWorkflowId;

    @Value("${ai.dify.workflow.answer-id:}")
    private String difyAnswerWorkflowId;

    @Value("${ai.dify.workflow.score-id:}")
    private String difyScoreWorkflowId;

    @Value("${ai.dify.timeout-seconds:90}")
    private int difyTimeoutSeconds;

    @Value("${ai.dify.session-storage.base-url:http://localhost:8081}")
    private String sessionStorageBaseUrl;

    @Value("${ai.dify.session-storage.api-key:${session.storage.api-key:${api.key:}}}")
    private String sessionStorageApiKey;

    @Value("${ai.dify.session-storage.enabled:true}")
    private boolean sessionStorageEnabled;

    @Override
    public String generateInterviewQuestion(String category, String difficulty, String context) {
        String prompt = String.format(
                "You are a %s technical interviewer. Please generate a %s-level interview question. Context: %s. Respond with the question text only.",
                category,
                difficulty,
                context != null ? context : "no additional context");
        return callOpenAI(prompt);
    }

    @Override
    public Map<String, Object> analyzeAnswer(String question, String answer, String expectedAnswer) {
        String prompt = String.format(
                "Evaluate the following interview response.\nQuestion: %s\nAnswer: %s\nReference answer: %s\n" +
                        "Score the reply (0-100) for technical accuracy, completeness, and clarity. Provide strengths, weaknesses, and concrete suggestions in JSON format.",
                question,
                answer,
                expectedAnswer != null ? expectedAnswer : "N/A");

        String response = callOpenAI(prompt);
        try {
            return JSONUtil.toBean(response, Map.class);
        } catch (Exception e) {
            logger.error("Failed to parse AI response as JSON", e);
            Map<String, Object> result = new HashMap<>();
            result.put("score", 70);
            result.put("feedback", response);
            return result;
        }
    }

    @Override
    public String generateFollowUpQuestion(String previousQuestion, String answer, String context) {
        String prompt = String.format(
                "Based on the previous question: %s\nCandidate answer: %s\nCreate a relevant follow-up question. Context: %s",
                previousQuestion,
                answer,
                context != null ? context : "");
        return callOpenAI(prompt);
    }

    @Override
    public Map<String, Object> generateInterviewReport(Long sessionId) {
        Map<String, Object> report = new HashMap<>();
        report.put("overall_score", 85.5);
        report.put("tech_score", 88.0);
        report.put("comm_score", 82.0);
        report.put("solve_score", 87.0);
        report.put("strengths", List.of("Technical depth", "Clear thinking"));
        report.put("weaknesses", List.of("Communication clarity", "Candidate answer must not be empty"));
        report.put("suggestions", List.of("Improve communication", "Practice more problems"));
        return report;
    }

    @Override
    public String chatWithAI(String message, String context) {
        String prompt = String.format("You are a helpful AI assistant. Message: %s\nContext: %s\nPlease provide a helpful response.",
                message,
                context != null ? context : "");
        return callOpenAI(prompt);
    }

    @Override
    public Map<String, Object> callDifyWorkflow(Map<String, Object> params) {
        String requestType = params == null ? null : (String) params.get("requestType");
        if (!StringUtils.hasText(requestType)) {
            return error("requestType must be provided");
        }
        if (!StringUtils.hasText(difyApiKey)) {
            return error("Dify API key is not configured");
        }

        try {
            return switch (requestType) {
                case "generate_questions" -> handleGenerateQuestions(params);
                case "score_answer" -> handleScoreAnswer(params);
                case "generate_standard_answer" -> handleStandardAnswer(params);
                default -> error("Unsupported requestType: " + requestType);
            };
        } catch (Exception e) {
            logger.error("Failed to invoke Dify workflow", e);
            return error("Failed to invoke Dify workflow: " + e.getMessage());
        }
    }

    private Map<String, Object> handleGenerateQuestions(Map<String, Object> params) throws Exception {
        String jobTitle = stringParam(params, "jobTitle", "job_title");
        if (!StringUtils.hasText(jobTitle)) {
            return error("jobTitle must be provided");
        }

        JSONObject inputs = JSONUtil.createObj();
        inputs.set("job_title", jobTitle);
        inputs.set("request_type", "generate_questions");

        JSONObject requestBody = buildWorkflowRequestBody(difyGenerateWorkflowId, inputs, params);
        JSONObject responseJson = invokeDify(requestBody);

        JSONObject outputs = extractOutputs(responseJson);
        if (outputs == null) {
            return error("Dify response payload is empty");
        }

        String sessionId = outputs.getStr("session_id", outputs.getStr("sessionId"));
        if (!StringUtils.hasText(sessionId)) {
            return error("Dify response did not include session_id");
        }

        List<Map<String, Object>> generatedQuestions = parseQuestionList(outputs);
        if (CollectionUtils.isEmpty(generatedQuestions)) {
            generatedQuestions = new ArrayList<>();
        }

        // Trigger standard answer workflow if available
        if (generatedQuestions.size() > 0 && StringUtils.hasText(difyAnswerWorkflowId)) {
            triggerStandardAnswerWorkflow(sessionId, generatedQuestions, jobTitle);
        }

        JSONObject sessionSnapshot = fetchSession(sessionId);
        if (sessionSnapshot != null) {
            List<Map<String, Object>> storedQuestions = toQuestionList(sessionSnapshot.get("questions"));
            if (!storedQuestions.isEmpty()) {
                generatedQuestions = storedQuestions;
            }
        }

        generatedQuestions.sort(Comparator.comparingInt(q -> ((Number) q.getOrDefault("order", 0)).intValue()));

        Map<String, Object> firstQuestion = generatedQuestions.isEmpty() ? Collections.emptyMap() : new LinkedHashMap<>(generatedQuestions.get(0));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("session_id", sessionId);
        result.put("sessionId", sessionId);
        result.put("job_title", jobTitle);
        result.put("jobTitle", jobTitle);
        result.put("questions", generatedQuestions);
        result.put("generated_questions", generatedQuestions.stream().map(q -> (String) q.get("question")).collect(java.util.stream.Collectors.toList()));
        result.put("selected_question", firstQuestion);
        result.put("selectedQuestion", firstQuestion);

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("workflowRunId", Optional.ofNullable(responseJson.getJSONObject("data")).map(d -> d.getStr("id")).orElse(null));
        metadata.put("sessionSnapshot", sessionSnapshot);
        result.put("metadata", metadata);

        return result;
    }

    private Map<String, Object> handleStandardAnswer(Map<String, Object> params) throws Exception {
        String sessionId = stringParam(params, "sessionId", "session_id");
        String questionId = stringParam(params, "questionId", "question_id");
        if (!StringUtils.hasText(sessionId) || !StringUtils.hasText(questionId)) {
            return error("sessionId and questionId must be provided");
        }
        if (!StringUtils.hasText(difyAnswerWorkflowId)) {
            return error("Unable to determine questionId for scoring");
        }

        JSONObject inputs = JSONUtil.createObj();
        inputs.set("session_id", sessionId);
        inputs.set("question_id", questionId);
        inputs.set("request_type", "generate_standard_answer");
        JSONObject requestBody = buildWorkflowRequestBody(difyAnswerWorkflowId, inputs, params);
        invokeDify(requestBody); // Ignore response for now

        JSONObject questionSnapshot = fetchQuestion(sessionId, questionId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("session_id", sessionId);
        result.put("question_id", questionId);
        result.put("question", questionSnapshot != null ? questionSnapshot.getStr("question") : null);
        result.put("answer", questionSnapshot != null ? questionSnapshot.getStr("answer") : null);
        return result;
    }

    private Map<String, Object> handleScoreAnswer(Map<String, Object> params) throws Exception {
        String sessionId = stringParam(params, "sessionId", "session_id");
        if (!StringUtils.hasText(sessionId)) {
            return error("sessionId is required");
        }

        String questionId = stringParam(params, "questionId", "question_id");
        String questionText = stringParam(params, "question");
        if (!StringUtils.hasText(questionId)) {
            questionId = findQuestionIdByText(sessionId, questionText);
        }
        if (!StringUtils.hasText(questionId)) {
            return error("Unable to determine questionId for scoring");
        }

        String candidateAnswer = stringParam(params, "candidateAnswer", "candidate_answer", "answer");
        if (!StringUtils.hasText(candidateAnswer)) {
            return error("Candidate answer must not be empty");
        }

        if (!StringUtils.hasText(difyScoreWorkflowId)) {
            return error("Score workflow ID is not configured");
        }

        JSONObject inputs = JSONUtil.createObj();
        inputs.set("session_id", sessionId);
        inputs.set("question_id", questionId);
        inputs.set("candidate_answer", candidateAnswer);
        inputs.set("request_type", "score_answer");

        JSONObject requestBody = buildWorkflowRequestBody(difyScoreWorkflowId, inputs, params);
        JSONObject responseJson = invokeDify(requestBody);
        JSONObject outputs = extractOutputs(responseJson);

        if (outputs == null) {
            return error("Dify response payload is empty");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("session_id", sessionId);
        result.put("sessionId", sessionId);
        result.put("question_id", questionId);
        result.put("questionId", questionId);

        Integer overallScore = outputs.getInt("overall_score");
        if (overallScore == null && outputs.containsKey("overallScore")) {
            overallScore = outputs.getInt("overallScore");
        }
        String evaluation = outputs.getStr("comprehensive_evaluation", outputs.getStr("comprehensiveEvaluation"));

        result.put("overall_score", overallScore);
        result.put("overallScore", overallScore);
        result.put("comprehensive_evaluation", evaluation);
        result.put("comprehensiveEvaluation", evaluation);

        JSONObject questionSnapshot = fetchQuestion(sessionId, questionId);
        if (questionSnapshot != null) {
            result.put("question", questionSnapshot.getStr("question"));
            result.put("standard_answer", questionSnapshot.getStr("answer"));
            result.put("standardAnswer", questionSnapshot.getStr("answer"));
        }

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("workflowRunId", Optional.ofNullable(responseJson.getJSONObject("data")).map(d -> d.getStr("id")).orElse(null));
        metadata.put("analysis_raw", outputs);
        result.put("metadata", metadata);

        return result;
    }

    private void triggerStandardAnswerWorkflow(String sessionId, List<Map<String, Object>> questions, String jobTitle) {
        if (!sessionStorageEnabled || !StringUtils.hasText(difyAnswerWorkflowId)) {
            return;
        }

        for (Map<String, Object> question : questions) {
            try {
                String questionId = (String) question.getOrDefault("id", "");
                if (!StringUtils.hasText(questionId)) {
                    continue;
                }
                JSONObject inputs = JSONUtil.createObj();
                inputs.set("session_id", sessionId);
                inputs.set("question_id", questionId);
                inputs.set("job_title", question.getOrDefault("jobTitle", jobTitle));
                inputs.set("request_type", "generate_standard_answer");
                JSONObject requestBody = buildWorkflowRequestBody(difyAnswerWorkflowId, inputs, Collections.emptyMap());
                invokeDify(requestBody);
                TimeUnit.MILLISECONDS.sleep(150);
            } catch (Exception e) {
                logger.warn("Failed to trigger standard answer workflow for session {} question {}", sessionId, question.get("id"), e);
            }
        }
    }

    private JSONObject buildWorkflowRequestBody(String workflowId, JSONObject inputs, Map<String, Object> params) {
        JSONObject requestBody = JSONUtil.createObj();
        requestBody.set("workflow_id", workflowId);
        requestBody.set("inputs", inputs);
        requestBody.set("response_mode", "blocking");
        String user = params == null ? null : stringParam(params, "user", "userId");
        requestBody.set("user", StringUtils.hasText(user) ? user : "interview-backend");
        return requestBody;
    }

    private JSONObject invokeDify(JSONObject requestBody) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(difyWorkflowUrl))
                .timeout(Duration.ofSeconds(difyTimeoutSeconds))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + difyApiKey)
                .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString(), StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        logger.info("Dify workflow response status: {}, body: {}", response.statusCode(), response.body());

        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            return JSONUtil.parseObj(response.body());
        }

        throw new IllegalStateException("Dify API request failed with HTTP status: " + response.statusCode() + ", body: " + response.body());
    }

    private JSONObject extractOutputs(JSONObject responseJson) {
        if (responseJson == null || !responseJson.containsKey("data")) {
            return null;
        }
        JSONObject data = responseJson.getJSONObject("data");
        if (data == null) {
            return null;
        }
        if (data.containsKey("outputs")) {
            return data.getJSONObject("outputs");
        }
        if (data.containsKey("output")) {
            return data.getJSONObject("output");
        }
        return null;
    }

    private List<Map<String, Object>> parseQuestionList(JSONObject outputs) {
        if (outputs == null) {
            return new ArrayList<>();
        }

        List<Map<String, Object>> results = new ArrayList<>();

        if (outputs.containsKey("question_list_json")) {
            String jsonStr = outputs.getStr("question_list_json");
            results.addAll(toQuestionList(jsonStr));
        }
        if (results.isEmpty() && outputs.containsKey("questions_json")) {
            String jsonStr = outputs.getStr("questions_json");
            results.addAll(toQuestionList(jsonStr));
        }
        if (results.isEmpty() && outputs.containsKey("questions")) {
            Object raw = outputs.get("questions");
            results.addAll(toQuestionList(raw));
        }
        if (results.isEmpty() && outputs.containsKey("generated_questions_list")) {
            Object raw = outputs.get("generated_questions_list");
            results.addAll(toQuestionList(raw));
        }

        int index = 0;
        for (Map<String, Object> question : results) {
            if (!question.containsKey("id")) {
                question.put("id", "q" + (++index));
            }
            question.putIfAbsent("order", index == 0 ? 1 : index + 1);
        }
        return results;
    }

    private List<Map<String, Object>> toQuestionList(Object raw) {
        if (raw == null) {
            return new ArrayList<>();
        }

        List<Map<String, Object>> result = new ArrayList<>();
        try {
            if (raw instanceof String str && StringUtils.hasText(str)) {
                JSONArray array = JSONUtil.parseArray(str);
                for (int i = 0; i < array.size(); i++) {
                    result.add(array.getJSONObject(i));
                }
            } else if (raw instanceof JSONArray array) {
                for (int i = 0; i < array.size(); i++) {
                    result.add(array.getJSONObject(i));
                }
            } else if (raw instanceof List<?> list) {
                for (Object item : list) {
                    if (item instanceof JSONObject json) {
                        result.add(json);
                    } else if (item instanceof Map<?, ?> map) {
                        Map<String, Object> converted = new LinkedHashMap<>();
                        map.forEach((k, v) -> converted.put(String.valueOf(k), v));
                        result.add(converted);
                    } else if (item instanceof String text) {
                        JSONObject json = JSONUtil.parseObj(text);
                        result.add(json);
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Failed to parse question list", e);
        }
        return result;
    }

    private JSONObject fetchSession(String sessionId) {
        if (!sessionStorageEnabled || !StringUtils.hasText(sessionStorageBaseUrl)) {
            return null;
        }
        return getFromStorage("/api/sessions/" + urlEncode(sessionId));
    }

    private JSONObject fetchQuestion(String sessionId, String questionId) {
        if (!sessionStorageEnabled || !StringUtils.hasText(sessionStorageBaseUrl)) {
            return null;
        }
        return getFromStorage("/api/sessions/" + urlEncode(sessionId) + "/questions/" + urlEncode(questionId));
    }

    private JSONObject getFromStorage(String path) {
        try {
            String url = buildStorageUrl(path);
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(difyTimeoutSeconds));

            if (StringUtils.hasText(sessionStorageApiKey)) {
                builder.header("Authorization", "Bearer " + sessionStorageApiKey);
            }

            HttpResponse<String> response = httpClient.send(builder.GET().build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return JSONUtil.parseObj(response.body());
            }
            logger.warn("Storage service returned status {} body {}", response.statusCode(), response.body());
        } catch (Exception e) {
            logger.warn("Failed to call storage service", e);
        }
        return null;
    }

    private String findQuestionIdByText(String sessionId, String questionText) {
        if (!StringUtils.hasText(questionText)) {
            return null;
        }
        JSONObject session = fetchSession(sessionId);
        if (session == null || !session.containsKey("questions")) {
            return null;
        }
        List<Map<String, Object>> questions = toQuestionList(session.get("questions"));
        for (Map<String, Object> question : questions) {
            if (questionText.equals(question.get("question"))) {
                return (String) question.get("id");
            }
        }
        return null;
    }

    private String buildStorageUrl(String path) {
        String base = sessionStorageBaseUrl;
        if (!StringUtils.hasText(base)) {
            base = "http://localhost:8081";
        }
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return base + path;
    }

    private String urlEncode(String value) {
        return value == null ? "" : java.net.URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String stringParam(Map<String, Object> params, String... keys) {
        if (params == null || keys == null) {
            return null;
        }
        for (String key : keys) {
            Object value = params.get(key);
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

    private Map<String, Object> error(String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("error", message);
        return result;
    }

    private String callOpenAI(String prompt) {
        try {
            JSONObject requestBody = JSONUtil.createObj();
            requestBody.put("model", openAiModel);
            requestBody.put("messages", List.of(Map.of("role", "user", "content", prompt)));
            requestBody.put("max_tokens", 1000);
            requestBody.put("temperature", 0.7);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(openAiBaseUrl + "/v1/chat/completions"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + openAiApiKey)
                    .timeout(Duration.ofMillis(openAiTimeoutMs))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString(), StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JSONObject responseJson = JSONUtil.parseObj(response.body());
                return responseJson.getJSONArray("choices")
                        .getJSONObject(0)
                        .getJSONObject("message")
                        .getStr("content");
            }
            logger.error("OpenAI API call failed with status: {}, body: {}", response.statusCode(), response.body());
            return "AI service is temporarily unavailable, please try again later.";
        } catch (Exception e) {
            logger.error("Failed to call OpenAI API", e);
            return "AI service encountered an unexpected error, please retry later.";
        }
    }
}
