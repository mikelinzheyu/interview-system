package com.interview.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.dto.RecordWrongAnswerRequest;
import com.interview.dto.WrongAnswerDto;
import com.interview.service.WrongAnswerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.util.HashMap;
import java.util.Map;

/**
 * WebSocket message handler for real-time wrong answers synchronization
 * Handles incoming WebSocket messages and broadcasts updates to connected clients
 */
@Controller
public class WrongAnswersWebSocketHandler {

    @Autowired
    private WrongAnswerService wrongAnswerService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Handle RECORD_WRONG_ANSWER message
     */
    @MessageMapping("/wrong-answers/record")
    public void handleRecordWrongAnswer(
            @Payload String payload,
            @Header("simpUser") String userId
    ) {
        try {
            JsonNode json = objectMapper.readTree(payload);

            RecordWrongAnswerRequest request = new RecordWrongAnswerRequest();
            request.setQuestionId(json.get("questionId").asLong());
            request.setSource(json.get("source").asText());
            request.setIsCorrect(json.get("isCorrect").asBoolean());
            request.setSourceInstanceId(json.get("sourceInstanceId").asLong());
            request.setQuestionTitle(json.get("questionTitle").asText());
            request.setQuestionContent(json.get("questionContent").asText());
            request.setDifficulty(json.get("difficulty").asText());

            // Record the wrong answer
            WrongAnswerDto result = wrongAnswerService.recordWrongAnswer(Long.parseLong(userId), request);

            // Broadcast to user's devices
            Map<String, Object> response = new HashMap<>();
            response.put("type", "RECORD_WRONG_ANSWER");
            response.put("data", result);
            response.put("timestamp", System.currentTimeMillis());

            messagingTemplate.convertAndSendToUser(
                    userId,
                    "/queue/wrong-answers",
                    response
            );
        } catch (Exception e) {
            sendError(userId, "Failed to record wrong answer: " + e.getMessage());
        }
    }

    /**
     * Handle UPDATE_STATUS message
     */
    @MessageMapping("/wrong-answers/update-status")
    public void handleUpdateStatus(
            @Payload String payload,
            @Header("simpUser") String userId
    ) {
        try {
            JsonNode json = objectMapper.readTree(payload);
            Long recordId = json.get("recordId").asLong();
            String status = json.get("status").asText();

            WrongAnswerDto result;
            if ("mastered".equals(status)) {
                result = wrongAnswerService.markAsMastered(Long.parseLong(userId), recordId);
            } else if ("reviewing".equals(status)) {
                result = wrongAnswerService.markAsReviewing(Long.parseLong(userId), recordId);
            } else {
                throw new IllegalArgumentException("Invalid status: " + status);
            }

            // Broadcast update
            Map<String, Object> response = new HashMap<>();
            response.put("type", "UPDATE_STATUS");
            response.put("data", result);
            response.put("timestamp", System.currentTimeMillis());

            messagingTemplate.convertAndSendToUser(
                    userId,
                    "/queue/wrong-answers",
                    response
            );
        } catch (Exception e) {
            sendError(userId, "Failed to update status: " + e.getMessage());
        }
    }

    /**
     * Handle UPDATE_NOTES message
     */
    @MessageMapping("/wrong-answers/update-notes")
    public void handleUpdateNotes(
            @Payload String payload,
            @Header("simpUser") String userId
    ) {
        try {
            JsonNode json = objectMapper.readTree(payload);
            Long recordId = json.get("recordId").asLong();
            String notes = json.get("notes").asText();

            WrongAnswerDto result = wrongAnswerService.updateUserNotes(Long.parseLong(userId), recordId, notes);

            // Broadcast update
            Map<String, Object> response = new HashMap<>();
            response.put("type", "UPDATE_NOTES");
            response.put("data", result);
            response.put("timestamp", System.currentTimeMillis());

            messagingTemplate.convertAndSendToUser(
                    userId,
                    "/queue/wrong-answers",
                    response
            );
        } catch (Exception e) {
            sendError(userId, "Failed to update notes: " + e.getMessage());
        }
    }

    /**
     * Handle UPDATE_TAGS message
     */
    @MessageMapping("/wrong-answers/update-tags")
    public void handleUpdateTags(
            @Payload String payload,
            @Header("simpUser") String userId
    ) {
        try {
            JsonNode json = objectMapper.readTree(payload);
            Long recordId = json.get("recordId").asLong();
            JsonNode tagsNode = json.get("tags");

            java.util.List<String> tags = new java.util.ArrayList<>();
            if (tagsNode.isArray()) {
                for (JsonNode tag : tagsNode) {
                    tags.add(tag.asText());
                }
            }

            WrongAnswerDto result = wrongAnswerService.updateUserTags(Long.parseLong(userId), recordId, tags);

            // Broadcast update
            Map<String, Object> response = new HashMap<>();
            response.put("type", "UPDATE_TAGS");
            response.put("data", result);
            response.put("timestamp", System.currentTimeMillis());

            messagingTemplate.convertAndSendToUser(
                    userId,
                    "/queue/wrong-answers",
                    response
            );
        } catch (Exception e) {
            sendError(userId, "Failed to update tags: " + e.getMessage());
        }
    }

    /**
     * Handle DELETE_RECORD message
     */
    @MessageMapping("/wrong-answers/delete")
    public void handleDeleteRecord(
            @Payload String payload,
            @Header("simpUser") String userId
    ) {
        try {
            JsonNode json = objectMapper.readTree(payload);
            Long recordId = json.get("recordId").asLong();

            wrongAnswerService.deleteWrongAnswer(Long.parseLong(userId), recordId);

            // Broadcast deletion
            Map<String, Object> response = new HashMap<>();
            response.put("type", "DELETE_RECORD");
            response.put("data", new HashMap<String, Object>() {{
                put("recordId", recordId);
            }});
            response.put("timestamp", System.currentTimeMillis());

            messagingTemplate.convertAndSendToUser(
                    userId,
                    "/queue/wrong-answers",
                    response
            );
        } catch (Exception e) {
            sendError(userId, "Failed to delete record: " + e.getMessage());
        }
    }

    /**
     * Handle SYNC_REQUEST message
     */
    @MessageMapping("/wrong-answers/sync-request")
    public void handleSyncRequest(
            @Payload String payload,
            @Header("simpUser") String userId
    ) {
        try {
            // Fetch latest statistics
            com.interview.dto.WrongAnswerStatisticsDto stats =
                    wrongAnswerService.getStatistics(Long.parseLong(userId));

            Map<String, Object> response = new HashMap<>();
            response.put("type", "SYNC_RESPONSE");
            response.put("data", stats);
            response.put("timestamp", System.currentTimeMillis());

            messagingTemplate.convertAndSendToUser(
                    userId,
                    "/queue/wrong-answers",
                    response
            );
        } catch (Exception e) {
            sendError(userId, "Failed to sync: " + e.getMessage());
        }
    }

    /**
     * Handle HEARTBEAT message
     */
    @MessageMapping("/wrong-answers/heartbeat")
    public void handleHeartbeat(@Header("simpUser") String userId) {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("type", "HEARTBEAT_ACK");
            response.put("timestamp", System.currentTimeMillis());

            messagingTemplate.convertAndSendToUser(
                    userId,
                    "/queue/wrong-answers",
                    response
            );
        } catch (Exception e) {
            // Silently fail for heartbeat
            System.err.println("Heartbeat failed: " + e.getMessage());
        }
    }

    /**
     * Send error message to user
     */
    private void sendError(String userId, String errorMessage) {
        try {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("type", "ERROR");
            errorResponse.put("message", errorMessage);
            errorResponse.put("timestamp", System.currentTimeMillis());

            messagingTemplate.convertAndSendToUser(
                    userId,
                    "/queue/wrong-answers",
                    errorResponse
            );
        } catch (Exception e) {
            System.err.println("Failed to send error message: " + e.getMessage());
        }
    }
}
