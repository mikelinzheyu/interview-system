package com.interview.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.support.TestSecurityConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@ContextConfiguration(classes = TestSecurityConfig.class)
class WrongAnswerControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private com.interview.util.JwtUtils jwtUtils;

    @BeforeEach
    void setUp() {
        Mockito.when(jwtUtils.getUserIdFromToken("test-token")).thenReturn(42L);
    }

    @Test
    void recordWrongAnswerEndpointPersistsData() throws Exception {
        Map<String, Object> payload = Map.of(
            "questionId", 9001,
            "source", "ai_interview",
            "isCorrect", false,
            "difficulty", "medium",
            "questionTitle", "What is virtual DOM?",
            "questionContent", "Explain virtual DOM in Vue",
            "knowledgePoints", List.of("vue", "virtual-dom"),
            "userTags", List.of("follow-up")
        );

        mockMvc.perform(post("/api/v1/wrong-answers")
                .header("Authorization", "Bearer test-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.wrongCount").value(1))
            .andExpect(jsonPath("$.data.reviewStatus").value("reviewing"));

        mockMvc.perform(get("/api/v1/wrong-answers")
                .header("Authorization", "Bearer test-token"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data[0].questionId").value(9001));
    }
}
