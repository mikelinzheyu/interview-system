package com.example.interviewstorage.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.ArrayList;

public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private final String requiredApiKey;

    public ApiKeyAuthFilter(String requiredApiKey) {
        this.requiredApiKey = requiredApiKey;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String apiKey = authHeader.substring(7);
            if (apiKey.equals(requiredApiKey)) {
                // 认证成功
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("user", null, new ArrayList<>());
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        filterChain.doFilter(request, response);
    }
}