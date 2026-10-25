package com.smartparking.servlet;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.smartparking.util.JsonUtil;
import jakarta.servlet.AsyncContext;
import jakarta.servlet.AsyncEvent;
import jakarta.servlet.AsyncListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.Instant;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Server-Sent Events (SSE) Real-Time Engine Servlet.
 * Enables live multi-device synchronization:
 * When User A on Computer 1 reserves or cancels a slot,
 * an SSE event is immediately broadcast to User B on Computer 2 and Mobile Phone.
 */
@WebServlet(name = "RealtimeServlet", urlPatterns = {"/api/events", "/api/realtime/broadcast"}, asyncSupported = true)
public class RealtimeServlet extends HttpServlet {

    private static final Set<AsyncContext> clients = ConcurrentHashMap.newKeySet();
    private static ScheduledExecutorService heartbeatExecutor;

    @Override
    public void init() throws ServletException {
        super.init();
        heartbeatExecutor = Executors.newSingleThreadScheduledExecutor();
        // Send keep-alive comment every 25 seconds to keep firewalls & proxies open
        heartbeatExecutor.scheduleAtFixedRate(() -> {
            for (AsyncContext ctx : clients) {
                try {
                    HttpServletResponse resp = (HttpServletResponse) ctx.getResponse();
                    PrintWriter out = resp.getWriter();
                    out.write(": keep-alive " + System.currentTimeMillis() + "\n\n");
                    out.flush();
                } catch (Exception e) {
                    clients.remove(ctx);
                }
            }
        }, 20, 25, TimeUnit.SECONDS);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("text/event-stream");
        resp.setCharacterEncoding("UTF-8");
        resp.setHeader("Cache-Control", "no-cache, no-transform");
        resp.setHeader("Connection", "keep-alive");
        resp.setHeader("X-Accel-Buffering", "no");

        PrintWriter out = resp.getWriter();
        out.write("event: connected\n");
        out.write("data: {\"status\":\"connected\",\"timestamp\":\"" + Instant.now().toString() + "\",\"connectedClients\":" + (clients.size() + 1) + "}\n\n");
        out.flush();

        final AsyncContext asyncContext = req.startAsync();
        asyncContext.setTimeout(0); // Indefinite SSE connection

        asyncContext.addListener(new AsyncListener() {
            @Override
            public void onComplete(AsyncEvent event) {
                clients.remove(asyncContext);
            }

            @Override
            public void onTimeout(AsyncEvent event) {
                clients.remove(asyncContext);
                try {
                    asyncContext.complete();
                } catch (Exception ignored) {}
            }

            @Override
            public void onError(AsyncEvent event) {
                clients.remove(asyncContext);
                try {
                    asyncContext.complete();
                } catch (Exception ignored) {}
            }

            @Override
            public void onStartAsync(AsyncEvent event) {}
        });

        clients.add(asyncContext);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        JsonObject json = null;
        try {
            json = JsonParser.parseString(sb.toString()).getAsJsonObject();
        } catch (Exception ignored) {}

        String eventType = (json != null && json.has("eventType")) ? json.get("eventType").getAsString() : "SYSTEM_SYNC";
        JsonObject payload = (json != null && json.has("payload")) ? json.getAsJsonObject("payload") : new JsonObject();

        broadcast(eventType, payload);

        JsonObject res = new JsonObject();
        res.addProperty("success", true);
        res.addProperty("message", "Event broadcast to all connected devices");
        res.addProperty("activeClients", clients.size() + com.smartparking.websocket.AdminWebSocketServer.getActiveSessionsCount());
        out.print(JsonUtil.toJson(res));
    }

    /**
     * Broadcasts an event to all connected devices in real time.
     *
     * @param eventType e.g. "SLOT_UPDATED", "BOOKING_CREATED", "BOOKING_CANCELLED"
     * @param data JSON payload
     */
    public static void broadcast(String eventType, JsonObject data) {
        if (data == null) {
            data = new JsonObject();
        }

        JsonObject wrapper = new JsonObject();
        wrapper.addProperty("eventType", eventType);
        wrapper.add("payload", data);
        wrapper.addProperty("timestamp", Instant.now().toString());
        wrapper.addProperty("broadcastAt", Instant.now().toString());

        // Top level fields for backwards compatibility
        if (data.has("notification")) {
            wrapper.add("notification", data.get("notification"));
        }
        if (data.has("booking")) {
            wrapper.add("booking", data.get("booking"));
        }

        String serialized = JsonUtil.toJson(wrapper);

        // 1. WebSocket Broadcast (<50ms latency)
        try {
            com.smartparking.websocket.AdminWebSocketServer.broadcast(eventType, data);
        } catch (Throwable ignored) {}

        // 2. Server-Sent Events (SSE) Broadcast (<100ms latency)
        for (AsyncContext ctx : clients) {
            try {
                HttpServletResponse resp = (HttpServletResponse) ctx.getResponse();
                PrintWriter out = resp.getWriter();
                out.write("event: message\n");
                out.write("data: " + serialized + "\n\n");
                out.flush();
            } catch (Exception e) {
                clients.remove(ctx);
                try {
                    ctx.complete();
                } catch (Exception ignored) {}
            }
        }
    }

    @Override
    public void destroy() {
        if (heartbeatExecutor != null && !heartbeatExecutor.isShutdown()) {
            heartbeatExecutor.shutdownNow();
        }
        for (AsyncContext ctx : clients) {
            try {
                ctx.complete();
            } catch (Exception ignored) {}
        }
        clients.clear();
        super.destroy();
    }
}
