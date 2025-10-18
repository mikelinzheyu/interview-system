package com.interview.chat.service;

import com.interview.chat.dto.ChatRoomCreateRequest;
import com.interview.chat.dto.ChatRoomDto;
import com.interview.chat.dto.ChatRoomListResponse;

public interface ChatService {
    ChatRoomListResponse getChatRooms(boolean includeStats);

    ChatRoomDto createChatRoom(ChatRoomCreateRequest request);

    ChatRoomDto joinRoom(Long roomId);

    ChatRoomDto leaveRoom(Long roomId);
}
