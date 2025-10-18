package com.interview.chat.dto;

import java.util.List;

public class ChatRoomListResponse {
    private List<ChatRoomDto> rooms;
    private ChatRoomStatsDto stats;

    public ChatRoomListResponse() {
    }

    public ChatRoomListResponse(List<ChatRoomDto> rooms, ChatRoomStatsDto stats) {
        this.rooms = rooms;
        this.stats = stats;
    }

    public List<ChatRoomDto> getRooms() {
        return rooms;
    }

    public void setRooms(List<ChatRoomDto> rooms) {
        this.rooms = rooms;
    }

    public ChatRoomStatsDto getStats() {
        return stats;
    }

    public void setStats(ChatRoomStatsDto stats) {
        this.stats = stats;
    }
}
