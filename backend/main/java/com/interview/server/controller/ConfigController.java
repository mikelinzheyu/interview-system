package com.interview.controller;

import com.interview.dto.ApiResponse;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/configs")
public class ConfigController {

    @GetMapping
    public ApiResponse<Map<String, Object>> getConfigs(
            @RequestParam(required = false) String category,
            @RequestParam(name = "public_only", required = false, defaultValue = "true") Boolean publicOnly) {

        Map<String, Object> configs = Map.of(
            "ai_models", new String[]{"gpt-4", "gpt-3.5-turbo", "claude-3"},
            "time_limits", Map.of(
                "junior", 30,
                "mid", 45,
                "senior", 60
            ),
            "score_weights", Map.of(
                "tech", 0.4,
                "comm", 0.3,
                "solve", 0.3
            )
        );

        return ApiResponse.success(configs);
    }
}