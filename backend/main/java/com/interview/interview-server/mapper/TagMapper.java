package com.interview.mapper;

import com.interview.entity.Tag;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface TagMapper {
    Tag selectById(@Param("id") Long id);
    Tag selectByName(@Param("name") String name);
    int insert(Tag tag);
    List<Tag> search(@Param("q") String q, @Param("limit") Integer limit);

    int linkQuestionTag(@Param("questionId") Long questionId, @Param("tagId") Long tagId);
}
