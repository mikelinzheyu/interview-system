package com.interview.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket Configuration for real-time wrong answers synchronization
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple in-memory message broker
        // For production, consider using RabbitMQ or other message brokers
        config.enableSimpleBroker("/topic", "/queue");

        // Set the prefix for messages sent to the server
        config.setApplicationDestinationPrefixes("/app");

        // Set the prefix for messages sent to specific users
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register WebSocket endpoint for wrong answers real-time sync
        registry.addEndpoint("/api/v1/ws/wrong-answers")
                .setAllowedOrigins("*")
                .withSockJS();

        // Alternative endpoint without SockJS for native WebSocket
        registry.addEndpoint("/api/v1/ws/wrong-answers")
                .setAllowedOrigins("*");
    }
}
