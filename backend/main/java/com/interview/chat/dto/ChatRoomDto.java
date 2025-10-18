package com.interview.chat.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public class ChatRoomDto {
    private Long id;
    private String name;
    private String description;
    private String type;
    private String avatar;
    private Integer memberCount;
    private Integer onlineCount;
    private Integer maxMembers;

    @JsonProperty("isFeatured")
    private boolean featured;

    @JsonProperty("isJoined")
    private boolean joined;

    private List<String> tags;
    private String categoryKey;
    private String categoryLabel;
    private Integer activityScore;
    private String ownerName;
    private String status;
    private ChatMessageDto lastMessage;
    private String lastMessageAt;
    private String createdAt;
    private String updatedAt;

    public ChatRoomDto() {
    }

    public ChatRoomDto copy() {
        ChatRoomDto dto = new ChatRoomDto();
        dto.setId(this.id);
        dto.setName(this.name);
        dto.setDescription(this.description);
        dto.setType(this.type);
        dto.setAvatar(this.avatar);
        dto.setMemberCount(this.memberCount);
        dto.setOnlineCount(this.onlineCount);
        dto.setMaxMembers(this.maxMembers);
        dto.setFeatured(this.featured);
        dto.setJoined(this.joined);
        dto.setCategoryKey(this.categoryKey);
        dto.setCategoryLabel(this.categoryLabel);
        dto.setActivityScore(this.activityScore);
        dto.setOwnerName(this.ownerName);
        dto.setStatus(this.status);
        dto.setLastMessage(this.lastMessage != null ? this.lastMessage.copy() : null);
        dto.setLastMessageAt(this.lastMessageAt);
        dto.setCreatedAt(this.createdAt);
        dto.setUpdatedAt(this.updatedAt);
        if (this.tags != null) {
            dto.setTags(new ArrayList<>(this.tags));
        }
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public Integer getMemberCount() {
        return memberCount;
    }

    public void setMemberCount(Integer memberCount) {
        this.memberCount = memberCount;
    }

    public Integer getOnlineCount() {
        return onlineCount;
    }

    public void setOnlineCount(Integer onlineCount) {
        this.onlineCount = onlineCount;
    }

    public Integer getMaxMembers() {
        return maxMembers;
    }

    public void setMaxMembers(Integer maxMembers) {
        this.maxMembers = maxMembers;
    }

    public boolean isFeatured() {
        return featured;
    }

    public void setFeatured(boolean featured) {
        this.featured = featured;
    }

    public boolean isJoined() {
        return joined;
    }

    public void setJoined(boolean joined) {
        this.joined = joined;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public String getCategoryKey() {
        return categoryKey;
    }

    public void setCategoryKey(String categoryKey) {
        this.categoryKey = categoryKey;
    }

    public String getCategoryLabel() {
        return categoryLabel;
    }

    public void setCategoryLabel(String categoryLabel) {
        this.categoryLabel = categoryLabel;
    }

    public Integer getActivityScore() {
        return activityScore;
    }

    public void setActivityScore(Integer activityScore) {
        this.activityScore = activityScore;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public ChatMessageDto getLastMessage() {
        return lastMessage;
    }

    public void setLastMessage(ChatMessageDto lastMessage) {
        this.lastMessage = lastMessage;
    }

    public String getLastMessageAt() {
        return lastMessageAt;
    }

    public void setLastMessageAt(String lastMessageAt) {
        this.lastMessageAt = lastMessageAt;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}
