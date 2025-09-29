package com.interview.mapper;

import com.interview.entity.Category;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CategoryMapper {

    List<Category> selectAll(@Param("type") String type, @Param("parentId") Long parentId);

    Category selectById(@Param("id") Long id);

    int insert(Category category);

    int updateById(Category category);

    int deleteById(@Param("id") Long id);

    int updateQuestionCount(@Param("id") Long id, @Param("count") Integer count);
}