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

    @Value("${ai.dify.workflow-url:https://udify.app/workflow/ZJIwyB7UMouf2H9V}")
    private String difyWorkflowUrl;

    @Value("${ai.dify.app-id:app-aROZ5FjseJWUtmRzzjlb6b5E}")
    private String difyAppId;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    @Override
    public String generateInterviewQuestion(String category, String difficulty, String context) {
        String prompt = String.format(
            "浣滀负涓€鍚?s鎶€鏈潰璇曞畼锛岃鐢熸垚涓€閬?s闅惧害鐨勯潰璇曢銆備笂涓嬫枃锛?s銆傝鐩存帴杩斿洖棰樼洰鍐呭锛屼笉瑕佸寘鍚叾浠栬鏄庛€?,
            category, difficulty, context != null ? context : "鏃犵壒娈婅姹?
        );

        return callOpenAI(prompt);
    }

    @Override
    public Map<String, Object> analyzeAnswer(String question, String answer, String expectedAnswer) {
        String prompt = String.format(
            "鍒嗘瀽浠ヤ笅闈㈣瘯棰樼殑鍥炵瓟璐ㄩ噺锛歕n棰樼洰锛?s\n鍥炵瓟锛?s\n鍙傝€冪瓟妗堬細%s\n" +
            "璇蜂粠浠ヤ笅缁村害璇勫垎锛?-100鍒嗭級锛氭妧鏈噯纭€с€佸畬鏁存€с€佽〃杈炬竻鏅板害銆? +
            "骞剁粰鍑哄叿浣撶殑浼樼偣銆佷笉瓒冲拰寤鸿銆傝繑鍥濲SON鏍煎紡銆?,
            question, answer, expectedAnswer != null ? expectedAnswer : "鏃犲弬鑰冪瓟妗?
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
            "鍩轰簬涓婁竴涓潰璇曢锛?s\n鍊欓€変汉鍥炵瓟锛?s\n璇风敓鎴愪竴涓浉鍏崇殑杩介棶鎴栨繁鍏ラ棶棰樸€備笂涓嬫枃锛?s",
            previousQuestion, answer, context != null ? context : ""
        );

        return callOpenAI(prompt);
    }

    @Override
    public Map<String, Object> generateInterviewReport(Long sessionId) {
        // 杩欓噷搴旇鑾峰彇浼氳瘽鐨勬墍鏈夊璇濊褰曪紝鐒跺悗鐢熸垚鎶ュ憡
        // 涓轰簡绀轰緥锛岃繑鍥炰竴涓ā鎷熺殑鎶ュ憡
        Map<String, Object> report = new HashMap<>();
        report.put("overall_score", 85.5);
        report.put("tech_score", 88.0);
        report.put("comm_score", 82.0);
        report.put("solve_score", 87.0);
        report.put("strengths", List.of("鎶€鏈熀纭€鎵庡疄", "琛ㄨ揪娓呮櫚"));
        report.put("weaknesses", List.of("閮ㄥ垎姒傚康闇€瑕佹繁鍏?, "瀹炶返缁忛獙鍙互鏇翠赴瀵?));
        report.put("suggestions", List.of("澶氬叧娉ㄦ柊鎶€鏈彂灞?, "澧炲姞椤圭洰瀹炶返缁忛獙"));
        return report;
    }

    @Override
    public String chatWithAI(String message, String context) {
        String prompt = String.format("鐢ㄦ埛娑堟伅锛?s\n涓婁笅鏂囷細%s\n璇蜂綔涓篈I鍔╂墜鍥炲銆?,
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
                return "AI鏈嶅姟鏆傛椂涓嶅彲鐢紝璇风◢鍚庨噸璇曘€?;
            }

        } catch (Exception e) {
            logger.error("Failed to call OpenAI API", e);
            return "AI鏈嶅姟寮傚父锛岃绋嶅悗閲嶈瘯銆?;
        }
    }

    @Override
    public Map<String, Object> callDifyWorkflow(Map<String, Object> params) {
        try {
            // 鏋勫缓Dify宸ヤ綔娴佽姹傚弬鏁?            JSONObject requestBody = JSONUtil.createObj();

            // 鏍规嵁requestType鍐冲畾濡備綍鏋勫缓inputs
            String requestType = (String) params.get("requestType");

            if ("generate_questions".equals(requestType)) {
                // 鐢熸垚闂鐨勮姹?                requestBody.put("inputs", Map.of(
                    "job_title", params.get("jobTitle")
                ));
                requestBody.put("response_mode", "blocking");
                requestBody.put("user", params.getOrDefault("userId", "user-" + System.currentTimeMillis()));
            }

            logger.info("Calling Dify workflow with params: {}", requestBody);

            // 璋冪敤Dify宸ヤ綔娴丄PI
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(difyWorkflowUrl))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + difyAppId)
                    .timeout(Duration.ofSeconds(60))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString()))
                    .build();

            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());

            logger.info("Dify workflow response status: {}, body: {}",
                       response.statusCode(), response.body());

            if (response.statusCode() == 200) {
                JSONObject responseJson = JSONUtil.parseObj(response.body());

                // 瑙ｆ瀽Dify宸ヤ綔娴佸搷搴?                Map<String, Object> result = new HashMap<>();
                result.put("success", true);

                // 鑾峰彇outputs涓殑鏁版嵁
                if (responseJson.containsKey("data")) {
                    JSONObject data = responseJson.getJSONObject("data");
                    if (data.containsKey("outputs")) {
                        JSONObject outputs = data.getJSONObject("outputs");

                        // 鎻愬彇session_id鍜宷uestions
                        if (outputs.containsKey("session_id")) {
                            result.put("session_id", outputs.getStr("session_id"));
                        }
                        if (outputs.containsKey("questions")) {
                            result.put("questions", outputs.get("questions"));
                        }
                        if (outputs.containsKey("questions_json")) {
                            result.put("questions_json", outputs.getStr("questions_json"));
                        }
                    }
                }

                return result;
            } else {
                logger.error("Dify workflow call failed with status: {}, body: {}",
                           response.statusCode(), response.body());
                Map<String, Object> errorResult = new HashMap<>();
                errorResult.put("success", false);
                errorResult.put("error", "Dify宸ヤ綔娴佽皟鐢ㄥけ璐? " + response.statusCode());
                return errorResult;
            }

        } catch (Exception e) {
            logger.error("Failed to call Dify workflow", e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("error", "璋冪敤Dify宸ヤ綔娴佸紓甯? " + e.getMessage());
            return errorResult;
        }
    }
}

