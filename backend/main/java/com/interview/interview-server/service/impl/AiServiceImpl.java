package com.interview.service.impl;

import cn.hutool.json.JSONUtil;
import cn.hutool.json.JSONObject;
import com.interview.service.AiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiServiceImpl implements AiService {

    private static final Logger logger = LoggerFactory.getLogger(AiServiceImpl.class);

    @Value("${ai.openai.api-key}")
    private String apiKey;

    @Value("${ai.openai.base-url}")
    private String baseUrl;

    @Value("${ai.openai.model}")
    private String model;

    @Value("${ai.openai.timeout}")
    private int timeout;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    @Override
    public String generateInterviewQuestion(String category, String difficulty, String context) {
        String prompt = String.format(
            "作为一名%s技术面试官，请生成一道%s难度的面试题。上下文：%s。请直接返回题目内容，不要包含其他说明。",
            category, difficulty, context != null ? context : "无特殊要求"
        );

        return callOpenAI(prompt);
    }

    @Override
    public Map<String, Object> analyzeAnswer(String question, String answer, String expectedAnswer) {
        String prompt = String.format(
            "分析以下面试题的回答质量：\n题目：%s\n回答：%s\n参考答案：%s\n" +
            "请从以下维度评分（0-100分）：技术准确性、完整性、表达清晰度。" +
            "并给出具体的优点、不足和建议。返回JSON格式。",
            question, answer, expectedAnswer != null ? expectedAnswer : "无参考答案"
        );

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
            "基于上一个面试题：%s\n候选人回答：%s\n请生成一个相关的追问或深入问题。上下文：%s",
            previousQuestion, answer, context != null ? context : ""
        );

        return callOpenAI(prompt);
    }

    @Override
    public Map<String, Object> generateInterviewReport(Long sessionId) {
        // 这里应该获取会话的所有对话记录，然后生成报告
        // 为了示例，返回一个模拟的报告
        Map<String, Object> report = new HashMap<>();
        report.put("overall_score", 85.5);
        report.put("tech_score", 88.0);
        report.put("comm_score", 82.0);
        report.put("solve_score", 87.0);
        report.put("strengths", List.of("技术基础扎实", "表达清晰"));
        report.put("weaknesses", List.of("部分概念需要深入", "实践经验可以更丰富"));
        report.put("suggestions", List.of("多关注新技术发展", "增加项目实践经验"));
        return report;
    }

    @Override
    public String chatWithAI(String message, String context) {
        String prompt = String.format("用户消息：%s\n上下文：%s\n请作为AI助手回复。",
                                    message, context != null ? context : "");
        return callOpenAI(prompt);
    }

    private String callOpenAI(String prompt) {
        try {
            JSONObject requestBody = JSONUtil.createObj();
            requestBody.put("model", model);
            requestBody.put("messages", List.of(
                Map.of("role", "user", "content", prompt)
            ));
            requestBody.put("max_tokens", 1000);
            requestBody.put("temperature", 0.7);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/v1/chat/completions"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .timeout(Duration.ofMillis(timeout))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString()))
                    .build();

            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JSONObject responseJson = JSONUtil.parseObj(response.body());
                return responseJson.getJSONArray("choices")
                        .getJSONObject(0)
                        .getJSONObject("message")
                        .getStr("content");
            } else {
                logger.error("OpenAI API call failed with status: {}, body: {}",
                           response.statusCode(), response.body());
                return "AI服务暂时不可用，请稍后重试。";
            }

        } catch (Exception e) {
            logger.error("Failed to call OpenAI API", e);
            return "AI服务异常，请稍后重试。";
        }
    }
}