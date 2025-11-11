package com.interview.controller;

import com.interview.config.WrongAnswersSchedulerConfig;
import com.interview.dto.ApiResponse;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/wrong-answers/config")
public class WrongAnswersConfigController {

    private final WrongAnswersSchedulerConfig config;

    public WrongAnswersConfigController(WrongAnswersSchedulerConfig config) {
        this.config = config;
    }

    @GetMapping
    public ApiResponse<Map<String, Object>> getConfig() {
        Map<String, Object> body = new HashMap<>();
        body.put("strategy", config.getStrategy());
        body.put("fsrsAlpha", config.getFsrsAlpha());
        return ApiResponse.success(body);
    }

    @PutMapping
    public ApiResponse<Map<String, Object>> updateConfig(@RequestBody UpdateConfigRequest req) {
        if (req == null) {
            return ApiResponse.error(400, "Invalid request body");
        }
        if (req.getStrategy() != null) {
            config.setStrategy(req.getStrategy());
        }
        if (req.getFsrsAlpha() != null) {
            config.setFsrsAlpha(req.getFsrsAlpha());
        }
        return getConfig();
    }

    public static class UpdateConfigRequest {
        private String strategy; // sm2|ebbinghaus|fsrs
        private Double fsrsAlpha; // (0,3]

        public String getStrategy() { return strategy; }
        public void setStrategy(String strategy) { this.strategy = strategy; }

        public Double getFsrsAlpha() { return fsrsAlpha; }
        public void setFsrsAlpha(Double fsrsAlpha) { this.fsrsAlpha = fsrsAlpha; }
    }
}

