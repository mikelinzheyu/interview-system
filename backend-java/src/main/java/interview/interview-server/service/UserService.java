package com.interview.service;

import com.interview.dto.UserLoginDto;
import com.interview.dto.UserRegisterDto;
import com.interview.entity.User;

public interface UserService {

    User register(UserRegisterDto registerDto);

    String login(UserLoginDto loginDto);

    User getUserById(Long id);

    User getUserByUsername(String username);

    User updateUserProfile(Long userId, User user);

    void changePassword(Long userId, String oldPassword, String newPassword);

    void logout(String token);
}