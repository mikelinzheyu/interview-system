package com.interview.controller;

import com.interview.dto.ApiResponse;
import com.interview.dto.UserLoginDto;
import com.interview.dto.UserRegisterDto;
import com.interview.entity.User;
import com.interview.service.UserService;
import com.interview.util.JwtUtils;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

//import javax.validation.Valid;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping("/register")
    public ApiResponse<Map<String, Object>> register(@Valid @RequestBody UserRegisterDto registerDto) {
        User user = userService.register(registerDto);
        String token = jwtUtils.generateToken(user.getUsername(), user.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("user", user);
        result.put("token", token);

        return ApiResponse.success(result);
    }

    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@Valid @RequestBody UserLoginDto loginDto) {
        String token = userService.login(loginDto);
        String username = jwtUtils.getUsernameFromToken(token);
        Long userId = jwtUtils.getUserIdFromToken(token);

        User user = userService.getUserById(userId);

        Map<String, Object> result = new HashMap<>();
        result.put("user", user);
        result.put("token", token);
        result.put("expires_at", LocalDateTime.now().plusDays(1));

        return ApiResponse.success(result);
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@RequestHeader("Authorization") String authorization) {
        if (authorization != null && authorization.startsWith("Bearer ")) {
            String token = authorization.substring(7);
            userService.logout(token);
        }
        return ApiResponse.success();
    }
}