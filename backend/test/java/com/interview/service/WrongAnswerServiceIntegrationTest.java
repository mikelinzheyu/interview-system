package com.interview.service;

import com.interview.dto.RecordWrongAnswerRequest;
import com.interview.dto.WrongAnswerDto;
import com.interview.dto.WrongAnswerStatisticsDto;
import com.interview.entity.WrongAnswerRecord;
import com.interview.mapper.WrongAnswerMapper;
import com.interview.service.impl.WrongAnswerServiceImpl;
import com.interview.support.TestSecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

@SpringBootTest
@ActiveProfiles("test")
@ContextConfiguration(classes = TestSecurityConfig.class)
@Transactional
class WrongAnswerServiceIntegrationTest {

    @Autowired
    private WrongAnswerService wrongAnswerService;

    @Autowired
    private WrongAnswerMapper wrongAnswerMapper;

    @Test
    void recordWrongAnswer_createsNewRecordWithDefaults() {
        RecordWrongAnswerRequest request = new RecordWrongAnswerRequest();
        request.setQuestionId(1001L);
        request.setSource("ai_interview");
        request.setIsCorrect(false);
        request.setDifficulty("medium");
        request.setQuestionTitle("Explain dependency injection");
        request.setQuestionContent("What problem does DI solve?");
        request.setKnowledgePoints(List.of("spring", "di"));
        request.setUserTags(List.of("retry"));

        WrongAnswerDto dto = wrongAnswerService.recordWrongAnswer(1L, request);

        assertThat(dto.getId()).isNotNull();
        WrongAnswerRecord stored = wrongAnswerMapper.selectById(dto.getId());
        assertThat(stored.getWrongCount()).isEqualTo(1);
        assertThat(stored.getReviewStatus()).isEqualTo("reviewing");
        assertThat(stored.getReviewPriority()).isEqualTo("medium");
        assertThat(stored.getNextReviewTime()).isNotNull();
        assertThat(stored.getNextReviewTime()).isAfter(LocalDateTime.now().minusMinutes(5));
        assertThat(stored.getUserTags()).containsExactly("retry");
        assertThat(stored.getKnowledgePoints()).containsExactly("spring", "di");
    }

    @Test
    void recordWrongAnswer_updatesExistingRecordAndMarksMastered() {
        Long userId = 2L;
        Long questionId = 2002L;

        RecordWrongAnswerRequest firstAttempt = new RecordWrongAnswerRequest();
        firstAttempt.setQuestionId(questionId);
        firstAttempt.setSource("ai_interview");
        firstAttempt.setIsCorrect(false);
        firstAttempt.setDifficulty("hard");
        wrongAnswerService.recordWrongAnswer(userId, firstAttempt);

        RecordWrongAnswerRequest correctAttempt = new RecordWrongAnswerRequest();
        correctAttempt.setQuestionId(questionId);
        correctAttempt.setSource("ai_interview");
        correctAttempt.setIsCorrect(true);
        correctAttempt.setDifficulty("hard");

        wrongAnswerService.recordWrongAnswer(userId, correctAttempt);
        wrongAnswerService.recordWrongAnswer(userId, correctAttempt);
        WrongAnswerDto mastered = wrongAnswerService.recordWrongAnswer(userId, correctAttempt);

        WrongAnswerRecord stored = wrongAnswerMapper.selectByUserAndQuestion(userId, questionId);
        assertThat(stored.getCorrectCount()).isEqualTo(3);
        assertThat(stored.getReviewStatus()).isEqualTo("mastered");
        assertThat(stored.getNextReviewTime()).isNull();
        assertThat(mastered.getCorrectCount()).isEqualTo(3);
        assertThat(mastered.getReviewStatus()).isEqualTo("mastered");
    }

    @Test
    void getStatistics_returnsAggregatedCounts() {
        Long userId = 3L;

        RecordWrongAnswerRequest mediumQuestion = new RecordWrongAnswerRequest();
        mediumQuestion.setQuestionId(3001L);
        mediumQuestion.setSource("ai_interview");
        mediumQuestion.setIsCorrect(false);
        mediumQuestion.setDifficulty("medium");
        wrongAnswerService.recordWrongAnswer(userId, mediumQuestion);

        RecordWrongAnswerRequest hardQuestion = new RecordWrongAnswerRequest();
        hardQuestion.setQuestionId(3002L);
        hardQuestion.setSource("ai_interview");
        hardQuestion.setIsCorrect(false);
        hardQuestion.setDifficulty("hard");
        WrongAnswerDto hardRecord = wrongAnswerService.recordWrongAnswer(userId, hardQuestion);
        wrongAnswerService.markAsMastered(userId, hardRecord.getId());

        RecordWrongAnswerRequest easyQuestion = new RecordWrongAnswerRequest();
        easyQuestion.setQuestionId(3003L);
        easyQuestion.setSource("question_bank");
        easyQuestion.setIsCorrect(false);
        easyQuestion.setDifficulty("easy");
        wrongAnswerService.recordWrongAnswer(userId, easyQuestion);

        WrongAnswerStatisticsDto stats = wrongAnswerService.getStatistics(userId);

        assertThat(stats.getTotalWrongCount()).isEqualTo(3);
        assertThat(stats.getMasteredCount()).isEqualTo(1);
        assertThat(stats.getReviewingCount()).isEqualTo(2);
        assertThat(stats.getUnreviewedCount()).isEqualTo(0);
        assertThat(stats.getMasteredPercentage()).isCloseTo(33.33, within(0.01));

        assertThat(stats.getCountBySource().get("ai_interview")).isEqualTo(2);
        assertThat(stats.getCountBySource().get("question_bank")).isEqualTo(1);
        assertThat(stats.getCountBySource().get("mock_exam")).isEqualTo(0);

        assertThat(stats.getCountByDifficulty().get("hard")).isEqualTo(1);
        assertThat(stats.getCountByDifficulty().get("medium")).isEqualTo(1);
        assertThat(stats.getCountByDifficulty().get("easy")).isEqualTo(1);

        assertThat(stats.getTodayWrongCount()).isEqualTo(3);
    }
}
