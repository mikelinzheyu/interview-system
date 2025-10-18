package com.interview.chat.controller;

import com.interview.chat.dto.ChatRoomCreateRequest;
import com.interview.chat.service.ChatService;
import com.interview.dto.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/rooms")
    public ApiResponse<?> listRooms(@RequestParam(value = "includeStats", required = false) Boolean includeStats) {
        boolean wantsStats = includeStats != null && includeStats;
        return ApiResponse.success(chatService.getChatRooms(wantsStats));
    }

    @PostMapping("/rooms")
    public ApiResponse<?> createRoom(@RequestBody ChatRoomCreateRequest request) {
        return ApiResponse.success(chatService.createChatRoom(request));
    }

    @PostMapping("/rooms/{roomId}/join")
    public ApiResponse<?> joinRoom(@PathVariable Long roomId) {
        return ApiResponse.success(chatService.joinRoom(roomId));
    }

    @PostMapping("/rooms/{roomId}/leave")
    public ApiResponse<?> leaveRoom(@PathVariable Long roomId) {
        return ApiResponse.success(chatService.leaveRoom(roomId));
    }
}
