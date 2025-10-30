package com.example.interviewstorage.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(ApiKeyAuthFilter.class);

    @Value("${api.key:ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0}")
    private String validApiKey;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String requestURI = request.getRequestURI();
        String method = request.getMethod();

        logger.debug("Filtering request: {} {}", method, requestURI);

        // 允许OPTIONS请求通过（用于CORS预检）
        if ("OPTIONS".equalsIgnoreCase(method)) {
            logger.debug("OPTIONS request allowed");
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        // 从请求头获取API Key
        String authHeader = request.getHeader("Authorization");

        logger.debug("Authorization header: {}", authHeader != null ? "Bearer ***" : "null");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String apiKey = authHeader.substring(7); // 移除 "Bearer " 前缀

            if (validApiKey.equals(apiKey)) {
                // API Key 验证通过
                logger.debug("API Key validated successfully");
                filterChain.doFilter(request, response);
                return;
            } else {
                logger.warn("Invalid API Key provided");
            }
        } else {
            logger.warn("No Authorization header or invalid format");
        }

        // API Key 验证失败，返回401错误
        logger.error("Authentication failed for {} {}", method, requestURI);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");

        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", "Invalid or missing API key");
        errorResponse.put("message", "Please provide a valid API key in the Authorization header");
        errorResponse.put("path", requestURI);

        ObjectMapper mapper = new ObjectMapper();
        response.getWriter().write(mapper.writeValueAsString(errorResponse));
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // 不需要验证的路径
        String path = request.getRequestURI();
        String method = request.getMethod();

        // 允许健康检查和监控端点无需认证
        boolean shouldSkip = path.startsWith("/actuator") ||
                            path.startsWith("/health") ||
                            (path.startsWith("/api/sessions") && "GET".equalsIgnoreCase(method));

        if (shouldSkip) {
            logger.debug("Skipping filter for path: {} {}", method, path);
        }

        return shouldSkip;
    }
}