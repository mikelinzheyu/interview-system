package com.interview.constant;

public class Constants {

    // 用户状态
    public static final String USER_STATUS_ACTIVE = "active";
    public static final String USER_STATUS_INACTIVE = "inactive";
    public static final String USER_STATUS_BANNED = "banned";

    // 题目难度
    public static final String DIFFICULTY_EASY = "easy";
    public static final String DIFFICULTY_MEDIUM = "medium";
    public static final String DIFFICULTY_HARD = "hard";

    // 题目类型
    public static final String QUESTION_TYPE_CHOICE = "choice";
    public static final String QUESTION_TYPE_CODING = "coding";
    public static final String QUESTION_TYPE_ESSAY = "essay";
    public static final String QUESTION_TYPE_PRACTICAL = "practical";

    // 面试会话状态
    public static final String SESSION_STATUS_INIT = "init";
    public static final String SESSION_STATUS_RUNNING = "running";
    public static final String SESSION_STATUS_PAUSED = "paused";
    public static final String SESSION_STATUS_DONE = "done";
    public static final String SESSION_STATUS_CANCELLED = "cancelled";

    // 面试类型
    public static final String INTERVIEW_TYPE_TECH = "tech";
    public static final String INTERVIEW_TYPE_BEHAVIOR = "behavior";
    public static final String INTERVIEW_TYPE_COMPREHENSIVE = "comprehensive";

    // AI角色
    public static final String AI_ROLE_INTERVIEWER = "interviewer";
    public static final String AI_ROLE_USER = "user";

    // 缓存键前缀
    public static final String CACHE_USER_PREFIX = "user:";
    public static final String CACHE_SESSION_PREFIX = "session:";
    public static final String CACHE_QUESTION_PREFIX = "question:";

    // Redis过期时间（秒）
    public static final int CACHE_EXPIRE_USER = 3600; // 1小时
    public static final int CACHE_EXPIRE_SESSION = 7200; // 2小时
    public static final int CACHE_EXPIRE_QUESTION = 1800; // 30分钟

    // 默认分页大小
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;
}