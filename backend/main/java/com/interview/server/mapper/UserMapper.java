package com.interview.mapper;

import com.interview.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserMapper {

    User selectById(@Param("id") Long id);

    User selectByUsername(@Param("username") String username);

    User selectByEmail(@Param("email") String email);

    User selectByUsernameOrEmail(@Param("usernameOrEmail") String usernameOrEmail);

    int insert(User user);

    int updateById(User user);

    int updatePasswordById(@Param("id") Long id, @Param("password") String password);

    int deleteById(@Param("id") Long id);

    int existsByUsername(@Param("username") String username);

    int existsByEmail(@Param("email") String email);
}