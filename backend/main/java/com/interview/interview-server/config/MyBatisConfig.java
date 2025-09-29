package com.interview.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@MapperScan("com.interview.mapper")
public class MyBatisConfig {
}