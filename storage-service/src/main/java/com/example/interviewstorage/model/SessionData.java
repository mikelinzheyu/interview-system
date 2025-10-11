package com.example.interviewstorage.model;

import lombok.Data;
import java.io.Serializable;
import java.util.List;
import java.util.Map;

@Data // Lombok 注解，自动生成 getter, setter, toString 等
public class SessionData implements Serializable {
    private String sessionId;
    private List<Map<String, Object>> qaData;
    private Map<String, Object> metadata;
    private String createdAt;
    private String updatedAt;
}
