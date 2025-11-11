package com.interview.dto;

import jakarta.validation.constraints.NotBlank;

//import javax.validation.constraints.NotBlank;

public class UserLoginDto {

    @NotBlank(message = "邮箱或用户名不能为空")
    private String email;

    @NotBlank(message = "密码不能为空")
    private String password;

    private Boolean remember;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Boolean getRemember() {
        return remember;
    }

    public void setRemember(Boolean remember) {
        this.remember = remember;
    }
}