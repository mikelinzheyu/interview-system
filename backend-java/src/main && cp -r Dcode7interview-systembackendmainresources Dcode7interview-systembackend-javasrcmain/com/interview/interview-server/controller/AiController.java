package com.interview.controller;

import com.interview.dto.ApiResponse;
import com.interview.service.AiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/ai")
public class AiController {

    @Autowired
    private AiService aiService;

    @PostMapping("/dify-workflow")
    public ApiResponse<Map<String, Object>> callDifyWorkflow(@RequestBody Map<String, Object> params) {
        Map<String, Object> result = aiService.callDifyWorkflow(params);
        return ApiResponse.success(result);
    }
}
