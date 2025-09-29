package com.interview.controller;

import com.interview.dto.ApiResponse;
import com.interview.entity.User;
import com.interview.service.UserService;
import com.interview.util.JwtUtils;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

//import javax.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtils jwtUtils;

    @GetMapping("/profile")
    public ApiResponse<User> getProfile(@RequestHeader("Authorization") String authorization) {
        String token = authorization.substring(7); // 移除 "Bearer " 前缀
        Long userId = jwtUtils.getUserIdFromToken(token);
        User user = userService.getUserById(userId);
        return ApiResponse.success(user);
    }

    @PutMapping("/profile")
    public ApiResponse<User> updateProfile(
            @RequestHeader("Authorization") String authorization,
            @Valid @RequestBody User userDto) {
        String token = authorization.substring(7);
        Long userId = jwtUtils.getUserIdFromToken(token);
        User updatedUser = userService.updateUserProfile(userId, userDto);
        return ApiResponse.success(updatedUser);
    }

    @PutMapping("/password")
    public ApiResponse<Void> changePassword(
            @RequestHeader("Authorization") String authorization,
            @RequestBody Map<String, String> passwordData) {
        String token = authorization.substring(7);
        Long userId = jwtUtils.getUserIdFromToken(token);

        String oldPassword = passwordData.get("old_password");
        String newPassword = passwordData.get("new_password");
        String confirmPassword = passwordData.get("confirm_password");

        if (!newPassword.equals(confirmPassword)) {
            return ApiResponse.error("新密码和确认密码不一致");
        }

        userService.changePassword(userId, oldPassword, newPassword);
        return ApiResponse.success();
    }
}