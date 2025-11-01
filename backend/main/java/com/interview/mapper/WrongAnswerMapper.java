package com.interview.mapper;

import com.interview.entity.WrongAnswerRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

/**
 * MyBatis Mapper for WrongAnswerRecord persistence
 */
@Mapper
public interface WrongAnswerMapper {

    /**
     * Insert a new wrong answer record
     */
    int insert(WrongAnswerRecord record);

    /**
     * Update an existing wrong answer record
     */
    int updateById(WrongAnswerRecord record);

    /**
     * Select wrong answer record by id
     */
    WrongAnswerRecord selectById(@Param("id") Long id);

    /**
     * Find or create wrong answer record (upsert logic helper)
     */
    WrongAnswerRecord selectByUserAndQuestion(
        @Param("userId") Long userId,
        @Param("questionId") Long questionId
    );

    /**
     * Get all wrong answer records for a user
     */
    List<WrongAnswerRecord> selectByUserId(@Param("userId") Long userId);

    /**
     * Get wrong answer records for a user by review status
     */
    List<WrongAnswerRecord> selectByUserIdAndStatus(
        @Param("userId") Long userId,
        @Param("reviewStatus") String reviewStatus
    );

    /**
     * Get wrong answer records for a user by source
     */
    List<WrongAnswerRecord> selectByUserIdAndSource(
        @Param("userId") Long userId,
        @Param("source") String source
    );

    /**
     * Get questions due for review (nextReviewTime <= now)
     */
    List<WrongAnswerRecord> selectDueForReview(
        @Param("userId") Long userId,
        @Param("now") LocalDateTime now
    );

    /**
     * Get wrong answer records by knowledge point
     */
    List<WrongAnswerRecord> selectByUserIdAndKnowledgePoint(
        @Param("userId") Long userId,
        @Param("knowledgePoint") String knowledgePoint
    );

    /**
     * Count total wrong questions for a user
     */
    int countByUserId(@Param("userId") Long userId);

    /**
     * Count wrong questions by review status
     */
    int countByUserIdAndStatus(
        @Param("userId") Long userId,
        @Param("reviewStatus") String reviewStatus
    );

    /**
     * Count wrong questions by source
     */
    int countByUserIdAndSource(
        @Param("userId") Long userId,
        @Param("source") String source
    );

    /**
     * Count wrong questions by difficulty
     */
    int countByUserIdAndDifficulty(
        @Param("userId") Long userId,
        @Param("difficulty") String difficulty
    );

    /**
     * Count today's wrong answers
     */
    int countTodayByUserId(
        @Param("userId") Long userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Delete a wrong answer record
     */
    int deleteById(@Param("id") Long id);

    /**
     * Delete old archived records (for maintenance)
     */
    int deleteByUserIdAndMasteredBefore(
        @Param("userId") Long userId,
        @Param("date") LocalDateTime date
    );
}
