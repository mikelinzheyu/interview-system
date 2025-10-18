package com.interview.chat.dto;

public class ChatMessageDto {
    private String content;
    private String type;

    public ChatMessageDto() {
    }

    public ChatMessageDto(String content) {
        this.content = content;
        this.type = "text";
    }

    public ChatMessageDto(String content, String type) {
        this.content = content;
        this.type = type;
    }

    public ChatMessageDto copy() {
        return new ChatMessageDto(this.content, this.type);
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
