package com.interview.mapper;

import com.interview.entity.WrongAnswerReviewLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface WrongAnswerReviewLogMapper {
    int insert(WrongAnswerReviewLog log);

    List<WrongAnswerReviewLog> selectByUserAndRecord(
        @Param("userId") Long userId,
        @Param("wrongAnswerId") Long wrongAnswerId
    );

    List<WrongAnswerReviewLog> selectByUserAndRecordFiltered(
        @Param("userId") Long userId,
        @Param("wrongAnswerId") Long wrongAnswerId,
        @Param("result") String result,
        @Param("from") java.time.LocalDateTime from,
        @Param("to") java.time.LocalDateTime to,
        @Param("offset") int offset,
        @Param("size") int size
    );

    long countByUserAndRecordFiltered(
        @Param("userId") Long userId,
        @Param("wrongAnswerId") Long wrongAnswerId,
        @Param("result") String result,
        @Param("from") java.time.LocalDateTime from,
        @Param("to") java.time.LocalDateTime to
    );
}
