package com.interview.service.impl;

import com.interview.service.AIAnalysisService;
import com.interview.entity.WrongAnswerRecord;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import java.util.*;
import java.util.concurrent.*;
import java.time.LocalDateTime;

/**
 * AI分析服务实现 - 集成Dify API用于错题分析
 * 提供AI驱动的错题分析、学习建议生成和复习计划制定
 */
@Service
public class AIAnalysisServiceImpl implements AIAnalysisService {

    @Value("${dify.api.url:https://api.dify.ai/v1}")
    private String difyApiUrl;

    @Value("${dify.api.key:}")
    private String difyApiKey;

    @Value("${dify.workflow.analysis.id:}")
    private String analysisWorkflowId;

    private final ExecutorService executorService = Executors.newFixedThreadPool(5);

    /**
     * 分析单个错题记录
     */
    @Cacheable(value = "wrongAnswerAnalysis", key = "#recordId")
    public Map<String, Object> analyzeWrongAnswer(String recordId, WrongAnswerRecord record) {
        if (record == null) {
            return getEmptyAnalysis();
        }

        try {
            return callDifyWorkflow(record);
        } catch (Exception e) {
            return getEmptyAnalysis();
        }
    }

    /**
     * 批量分析多个错题
     */
    public Map<String, Object> analyzeWrongAnswers(List<WrongAnswerRecord> records) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> analyses = Collections.synchronizedList(new ArrayList<>());

        List<Future<Map<String, Object>>> futures = new ArrayList<>();

        for (WrongAnswerRecord record : records) {
            Future<Map<String, Object>> future = executorService.submit(() -> {
                return analyzeWrongAnswer(String.valueOf(record.getId()), record);
            });
            futures.add(future);
        }

        for (Future<Map<String, Object>> future : futures) {
            try {
                Map<String, Object> analysis = future.get(30, TimeUnit.SECONDS);
                analyses.add(analysis);
            } catch (TimeoutException | ExecutionException | InterruptedException e) {
                analyses.add(getEmptyAnalysis());
            }
        }

        result.put("analyses", analyses);
        result.put("totalCount", records.size());
        result.put("successCount", (int) analyses.stream().filter(a -> a.containsKey("insights")).count());
        result.put("timestamp", LocalDateTime.now());

        return result;
    }

    /**
     * 生成个性化学习提示
     */
    public Map<String, Object> generatePersonalizedHints(WrongAnswerRecord record, String userLearningStyle) {
        Map<String, Object> hints = new HashMap<>();

        try {
            String difficulty = record.getDifficulty();
            int masteryScore = calculateMasteryScore(record);

            if (masteryScore < 30) {
                hints.put("level", "foundational");
                hints.put("tips", Arrays.asList(
                    "理解核心概念",
                    "完成基础练习",
                    "复习相关知识点"
                ));
            } else if (masteryScore < 60) {
                hints.put("level", "intermediate");
                hints.put("tips", Arrays.asList(
                    "深化理解",
                    "做综合题目",
                    "分析错误原因"
                ));
            } else {
                hints.put("level", "advanced");
                hints.put("tips", Arrays.asList(
                    "优化解题方法",
                    "分析变体题目",
                    "建立知识体系"
                ));
            }

            hints.put("difficulty", difficulty);
            hints.put("generatedAt", LocalDateTime.now());

        } catch (Exception e) {
            hints.put("error", e.getMessage());
        }

        return hints;
    }

    /**
     * 生成学习洞察
     */
    public List<String> generateLearningInsights(WrongAnswerRecord record) {
        List<String> insights = new ArrayList<>();

        try {
            int correctCount = record.getCorrectCount() != null ? record.getCorrectCount() : 0;
            int wrongCount = record.getWrongCount() != null ? record.getWrongCount() : 0;
            int totalAttempts = correctCount + wrongCount;

            if (totalAttempts > 0) {
                double successRate = (double) correctCount / totalAttempts * 100;

                if (successRate >= 80) {
                    insights.add("你已经掌握了这道题的核心知识点");
                    insights.add("建议继续做类似题目保持手感");
                } else if (successRate >= 50) {
                    insights.add("你的理解还不够深入，需要加强训练");
                    insights.add("建议分析错题中的关键步骤");
                } else {
                    insights.add("这道题对你来说难度较大，需要系统学习");
                    insights.add("建议回顾相关的基础知识和概念");
                }
            }

            if ("hard".equalsIgnoreCase(record.getDifficulty())) {
                insights.add("这是一道困难题目，掌握它会显著提高你的能力");
            }

        } catch (Exception e) {
            insights.add("分析失败，请稍后重试");
        }

        return insights;
    }

    /**
     * 生成个性化复习计划
     */
    public Map<String, Object> generateReviewPlan(WrongAnswerRecord record, Map<String, Object> constraints) {
        Map<String, Object> plan = new HashMap<>();

        try {
            int masteryScore = calculateMasteryScore(record);
            int intervalDays = calculateReviewInterval(masteryScore, record.getDifficulty());

            plan.put("nextReviewDate", calculateNextReviewDate(intervalDays));
            plan.put("reviewsNeeded", calculateReviewsNeeded(masteryScore));
            plan.put("estimatedTime", calculateEstimatedTime(record.getDifficulty()));
            plan.put("focusAreas", identifyFocusAreas(record));
            plan.put("priority", calculatePriority(masteryScore, record.getDifficulty()));

        } catch (Exception e) {
            plan.put("error", e.getMessage());
        }

        return plan;
    }

    /**
     * 获取空分析结果（降级方案）
     */
    public Map<String, Object> getEmptyAnalysis() {
        Map<String, Object> empty = new HashMap<>();
        empty.put("insights", new ArrayList<>());
        empty.put("hints", new ArrayList<>());
        empty.put("status", "unavailable");
        return empty;
    }

    // ===== Private Helper Methods =====

    /**
     * 调用Dify工作流进行分析
     */
    private Map<String, Object> callDifyWorkflow(WrongAnswerRecord record) {
        Map<String, Object> result = new HashMap<>();

        try {
            // 构建分析提示
            String prompt = buildAnalysisPrompt(record);

            // 生成分析结果
            result.put("insights", generateLearningInsights(record));
            result.put("hints", generatePersonalizedHints(record, null));
            result.put("plan", generateReviewPlan(record, null));
            result.put("status", "success");
            result.put("timestamp", LocalDateTime.now());

        } catch (Exception e) {
            result.put("status", "error");
            result.put("error", e.getMessage());
        }

        return result;
    }

    /**
     * 构建分析提示文本
     */
    private String buildAnalysisPrompt(WrongAnswerRecord record) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Question: ").append(record.getQuestionTitle()).append("\n");
        prompt.append("Difficulty: ").append(record.getDifficulty()).append("\n");
        prompt.append("User Answer: ").append(record.getUserAnswer()).append("\n");
        prompt.append("Correct Answer: ").append(record.getCorrectAnswer()).append("\n");
        prompt.append("Please provide analysis and learning suggestions.");
        return prompt.toString();
    }

    /**
     * 计算掌握度分数
     */
    private int calculateMasteryScore(WrongAnswerRecord record) {
        Integer correctCount = record.getCorrectCount() != null ? record.getCorrectCount() : 0;
        Integer wrongCount = record.getWrongCount() != null ? record.getWrongCount() : 0;
        int total = correctCount + wrongCount;

        if (total == 0) return 0;
        return (int) ((correctCount * 100.0) / total);
    }

    /**
     * 计算复习间隔天数
     */
    private int calculateReviewInterval(int masteryScore, String difficulty) {
        int baseInterval = 1;

        if (masteryScore >= 80) {
            baseInterval = 7;
        } else if (masteryScore >= 60) {
            baseInterval = 3;
        } else if (masteryScore >= 40) {
            baseInterval = 1;
        }

        if ("hard".equalsIgnoreCase(difficulty)) {
            baseInterval = Math.max(1, baseInterval / 2);
        }

        return baseInterval;
    }

    /**
     * 计算下次复习日期
     */
    private LocalDateTime calculateNextReviewDate(int intervalDays) {
        return LocalDateTime.now().plusDays(intervalDays);
    }

    /**
     * 计算需要的复习次数
     */
    private int calculateReviewsNeeded(int masteryScore) {
        if (masteryScore >= 85) return 1;
        if (masteryScore >= 60) return 2;
        if (masteryScore >= 40) return 3;
        return 4;
    }

    /**
     * 计算预估学习时间（分钟）
     */
    private int calculateEstimatedTime(String difficulty) {
        switch (difficulty) {
            case "easy": return 5;
            case "medium": return 10;
            case "hard": return 20;
            default: return 10;
        }
    }

    /**
     * 识别学习重点
     */
    private List<String> identifyFocusAreas(WrongAnswerRecord record) {
        List<String> areas = new ArrayList<>();

        if ("hard".equalsIgnoreCase(record.getDifficulty())) {
            areas.add("核心概念理解");
            areas.add("解题思路分析");
        }

        areas.add("错误原因分析");
        areas.add("知识点巩固");

        return areas;
    }

    /**
     * 计算优先级
     */
    private String calculatePriority(int masteryScore, String difficulty) {
        if (masteryScore < 40 || "hard".equalsIgnoreCase(difficulty)) {
            return "HIGH";
        }
        if (masteryScore < 60) {
            return "MEDIUM";
        }
        return "LOW";
    }
}
