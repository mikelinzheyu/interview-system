package com.interview.mapper;

import com.interview.entity.Question;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface QuestionMapper {

    List<Question> selectPage(@Param("offset") int offset,
                              @Param("size") int size,
                              @Param("categoryId") Long categoryId,
                              @Param("difficulty") String difficulty,
                              @Param("type") String type,
                              @Param("keyword") String keyword,
                              @Param("tags") String tags,
                              @Param("tagList") java.util.List<String> tagList,
                              @Param("sort") String sort);

    long countByCondition(@Param("categoryId") Long categoryId,
                          @Param("difficulty") String difficulty,
                          @Param("type") String type,
                          @Param("keyword") String keyword,
                          @Param("tags") String tags,
                          @Param("tagList") java.util.List<String> tagList);

    Question selectById(@Param("id") Long id);

    int insert(Question question);

    int updateById(Question question);

    int deleteById(@Param("id") Long id);

    int incrementViewCount(@Param("id") Long id);

    int incrementLikeCount(@Param("id") Long id);

    // Facets
    List<com.interview.dto.FacetBucket> countByDifficulty(@Param("categoryId") Long categoryId,
                                                          @Param("keyword") String keyword,
                                                          @Param("tags") String tags);

    List<com.interview.dto.FacetBucket> countByCategory(@Param("keyword") String keyword,
                                                        @Param("tags") String tags);

    // Status updates
    int publish(@Param("id") Long id);
    int archive(@Param("id") Long id);
}
