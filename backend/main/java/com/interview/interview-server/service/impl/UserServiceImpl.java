package com.interview.service.impl;

import com.interview.dto.UserLoginDto;
import com.interview.dto.UserRegisterDto;
import com.interview.entity.User;
import com.interview.exception.BusinessException;
import com.interview.mapper.UserMapper;
import com.interview.service.UserService;
import com.interview.util.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Override
    public User register(UserRegisterDto registerDto) {
        // 检查用户名是否已存在
        if (userMapper.existsByUsername(registerDto.getUsername()) > 0) {
            throw new BusinessException(409, "用户名已存在");
        }

        // 检查邮箱是否已存在
        if (userMapper.existsByEmail(registerDto.getEmail()) > 0) {
            throw new BusinessException(409, "邮箱已被注册");
        }

        // 创建新用户
        User user = new User(
            registerDto.getUsername(),
            registerDto.getEmail(),
            passwordEncoder.encode(registerDto.getPassword())
        );
        user.setRealName(registerDto.getRealName());
        user.setPhone(registerDto.getPhone());

        userMapper.insert(user);
        return user;
    }

    @Override
    public String login(UserLoginDto loginDto) {
        // 根据用户名或邮箱查找用户
        User user = userMapper.selectByUsernameOrEmail(loginDto.getEmail());
        if (user == null) {
            throw new BusinessException(401, "用户不存在");
        }

        // 验证密码
        if (!passwordEncoder.matches(loginDto.getPassword(), user.getPassword())) {
            throw new BusinessException(401, "密码错误");
        }

        // 检查用户状态
        if (!"active".equals(user.getStatus())) {
            throw new BusinessException(403, "用户已被禁用");
        }

        // 生成JWT token
        return jwtUtils.generateToken(user.getUsername(), user.getId());
    }

    @Override
    public User getUserById(Long id) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        return user;
    }

    @Override
    public User getUserByUsername(String username) {
        return userMapper.selectByUsername(username);
    }

    @Override
    public User updateUserProfile(Long userId, User user) {
        User existingUser = getUserById(userId);

        if (user.getRealName() != null) existingUser.setRealName(user.getRealName());
        if (user.getNickname() != null) existingUser.setNickname(user.getNickname());
        if (user.getGender() != null) existingUser.setGender(user.getGender());
        if (user.getBirthday() != null) existingUser.setBirthday(user.getBirthday());
        if (user.getBio() != null) existingUser.setBio(user.getBio());
        if (user.getPhone() != null) existingUser.setPhone(user.getPhone());
        if (user.getAvatar() != null) existingUser.setAvatar(user.getAvatar());
        
        if (user.getTwoFactorEnabled() != null) existingUser.setTwoFactorEnabled(user.getTwoFactorEnabled());
        if (user.getPreferences() != null) existingUser.setPreferences(user.getPreferences());
        if (user.getNotificationSettings() != null) existingUser.setNotificationSettings(user.getNotificationSettings());
        if (user.getPrivacySettings() != null) existingUser.setPrivacySettings(user.getPrivacySettings());

        userMapper.updateById(existingUser);
        return existingUser;
    }

    @Override
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = getUserById(userId);

        // 验证旧密码
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new BusinessException(400, "旧密码错误");
        }

        // 更新密码
        String encodedNewPassword = passwordEncoder.encode(newPassword);
        userMapper.updatePasswordById(userId, encodedNewPassword);
    }

    @Override
    public void logout(String token) {
        // 实现token黑名单或Redis缓存失效
        // 这里可以将token加入黑名单
    }
}