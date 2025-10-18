package com.interview.chat.dto;

public class ChatRoomStatsDto {
    private int totalRooms;
    private int joinedRooms;
    private int trendingRooms;
    private int newRooms;
    private int onlineUsers;

    public ChatRoomStatsDto() {
    }

    public ChatRoomStatsDto(int totalRooms, int joinedRooms, int trendingRooms, int newRooms, int onlineUsers) {
        this.totalRooms = totalRooms;
        this.joinedRooms = joinedRooms;
        this.trendingRooms = trendingRooms;
        this.newRooms = newRooms;
        this.onlineUsers = onlineUsers;
    }

    public int getTotalRooms() {
        return totalRooms;
    }

    public void setTotalRooms(int totalRooms) {
        this.totalRooms = totalRooms;
    }

    public int getJoinedRooms() {
        return joinedRooms;
    }

    public void setJoinedRooms(int joinedRooms) {
        this.joinedRooms = joinedRooms;
    }

    public int getTrendingRooms() {
        return trendingRooms;
    }

    public void setTrendingRooms(int trendingRooms) {
        this.trendingRooms = trendingRooms;
    }

    public int getNewRooms() {
        return newRooms;
    }

    public void setNewRooms(int newRooms) {
        this.newRooms = newRooms;
    }

    public int getOnlineUsers() {
        return onlineUsers;
    }

    public void setOnlineUsers(int onlineUsers) {
        this.onlineUsers = onlineUsers;
    }
}
