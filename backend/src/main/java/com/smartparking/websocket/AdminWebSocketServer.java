package com.smartparking.websocket;

import com.google.gson.JsonObject;
import com.smartparking.util.JsonUtil;
import jakarta.websocket.OnClose;
import jakarta.websocket.OnError;
import jakarta.websocket.OnMessage;
import jakarta.websocket.OnOpen;
import jakarta.websocket.Session;
import jakarta.websocket.server.ServerEndpoint;

import java.io.IOException;
import java.time.Instant;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * High-performance, full-duplex WebSocket Server Endpoint for Real-Time Admin Notifications.
 * Provides sub-second latency (&lt;100ms) between Java/Servlet backend and Admin Console.
 */
@ServerEndpoint("/api/ws")
public class AdminWebSocketServer {

    private static final Set<Session> activeSessions = ConcurrentHashMap.newKeySet();

    @OnOpen
    public void onOpen(Session session) {
        activeSessions.add(session);
        // Send initial handshake confirmation
        JsonObject welcome = new JsonObject();
        welcome.addProperty("eventType", "CONNECTED");
        welcome.addProperty("message", "Connected to Smart Parking Real-Time WebSocket Engine");
        welcome.addProperty("connectedClients", activeSessions.size());
        welcome.addProperty("timestamp", Instant.now().toString());

        try {
            session.getBasicRemote().sendText(JsonUtil.toJson(welcome));
        } catch (IOException ignored) {}
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        // Handle ping / heartbeat or client messages
        if ("ping".equalsIgnoreCase(message.trim())) {
            try {
                session.getBasicRemote().sendText("{\"eventType\":\"PONG\",\"timestamp\":\"" + Instant.now().toString() + "\"}");
            } catch (IOException ignored) {}
        }
    }

    @OnClose
    public void onClose(Session session) {
        activeSessions.remove(session);
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        activeSessions.remove(session);
    }

    /**
     * Broadcasts an event to all connected WebSocket clients instantly.
     *
     * @param eventType e.g. "ADMIN_NOTIFICATION", "BOOKING_CREATED"
     * @param payload JSON payload containing notification / booking details
     */
    public static void broadcast(String eventType, JsonObject payload) {
        if (payload == null) {
            payload = new JsonObject();
        }

        JsonObject messageObj = new JsonObject();
        messageObj.addProperty("eventType", eventType);
        messageObj.add("payload", payload);
        messageObj.addProperty("timestamp", Instant.now().toString());
        messageObj.addProperty("activeClientsCount", activeSessions.size());

        // Also duplicate top-level fields for backwards-compatibility and flexible client consumption
        for (String key : payload.keySet()) {
            if (!messageObj.has(key)) {
                messageObj.add(key, payload.get(key));
            }
        }

        String message = JsonUtil.toJson(messageObj);

        for (Session session : activeSessions) {
            if (session.isOpen()) {
                try {
                    session.getAsyncRemote().sendText(message);
                } catch (Exception e) {
                    activeSessions.remove(session);
                }
            } else {
                activeSessions.remove(session);
            }
        }
    }

    public static int getActiveSessionsCount() {
        return activeSessions.size();
    }
}
