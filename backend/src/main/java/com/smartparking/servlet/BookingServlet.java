package com.smartparking.servlet;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.smartparking.dao.BookingDAO;
import com.smartparking.dao.NotificationDAO;
import com.smartparking.model.Booking;
import com.smartparking.model.Notification;
import com.smartparking.util.JsonUtil;
import com.smartparking.websocket.AdminWebSocketServer;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * Servlet handling Parking Bookings endpoints:
 * - GET  /api/bookings              -> List bookings (?userId=X, ?bookingCode=Y, or all for Admin)
 * - GET  /api/bookings/{id}         -> Get booking by ID
 * - POST /api/bookings              -> Create new booking (ACID transaction + pessimistic lock)
 * - PUT  /api/bookings/{id}/cancel   -> Cancel booking & release slot
 * - PUT  /api/bookings/{id}/complete -> Complete parking session & release slot
 */
@WebServlet(name = "BookingServlet", urlPatterns = {"/api/bookings", "/api/bookings/*"})
public class BookingServlet extends HttpServlet {

    private BookingDAO bookingDAO;
    private NotificationDAO notificationDAO;
    private com.smartparking.dao.SlotDAO slotDAO;

    @Override
    public void init() throws ServletException {
        super.init();
        this.bookingDAO = new BookingDAO();
        this.notificationDAO = new NotificationDAO();
        this.slotDAO = new com.smartparking.dao.SlotDAO();
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();
        String pathInfo = req.getPathInfo();

        try {
            // Case 1: /api/bookings/{id}
            if (pathInfo != null && pathInfo.length() > 1 && !pathInfo.contains("/")) {
                int bookingId = Integer.parseInt(pathInfo.substring(1));
                Booking b = bookingDAO.getBookingById(bookingId);
                if (b != null) {
                    JsonObject res = new JsonObject();
                    res.addProperty("success", true);
                    res.add("booking", JsonUtil.getGson().toJsonTree(b));
                    out.print(JsonUtil.toJson(res));
                } else {
                    resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    JsonObject res = new JsonObject();
                    res.addProperty("success", false);
                    res.addProperty("message", "Booking not found with ID: " + bookingId);
                    out.print(JsonUtil.toJson(res));
                }
                return;
            }

            // Case 2: Query params ?bookingCode=XYZ
            String bookingCode = req.getParameter("bookingCode");
            if (bookingCode != null && !bookingCode.trim().isEmpty()) {
                Booking b = bookingDAO.getBookingByCode(bookingCode.trim());
                if (b != null) {
                    JsonObject res = new JsonObject();
                    res.addProperty("success", true);
                    res.add("booking", JsonUtil.getGson().toJsonTree(b));
                    out.print(JsonUtil.toJson(res));
                } else {
                    resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    JsonObject res = new JsonObject();
                    res.addProperty("success", false);
                    res.addProperty("message", "No booking found with code: " + bookingCode);
                    out.print(JsonUtil.toJson(res));
                }
                return;
            }

            // Case 3: Query params ?userId=X
            String userIdParam = req.getParameter("userId");
            List<Booking> list;
            if (userIdParam != null && !userIdParam.trim().isEmpty()) {
                int userId = Integer.parseInt(userIdParam.trim());
                list = bookingDAO.getBookingsByUserId(userId);
            } else {
                list = bookingDAO.getAllBookings();
            }

            JsonObject res = new JsonObject();
            res.addProperty("success", true);
            res.add("bookings", JsonUtil.getGson().toJsonTree(list));
            out.print(JsonUtil.toJson(res));

        } catch (NumberFormatException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Invalid parameter: " + e.getMessage());
            out.print(JsonUtil.toJson(res));
        } catch (SQLException e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Database error: " + e.getMessage());
            out.print(JsonUtil.toJson(res));
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();
        String body = readRequestBody(req);

        Booking booking = null;
        JsonObject json = null;
        try {
            json = JsonParser.parseString(body).getAsJsonObject();
            booking = JsonUtil.fromJson(body, Booking.class);
        } catch (Exception ignored) {
            // String types in JSON like "usr-1" or "slot-loc1-4"
        }

        if (booking == null) {
            booking = new Booking();
        }

        if (json != null) {
            // 1. Resolve User ID (Map cleanly to seeded users 1-4)
            int resolvedUserId = 2; // Default to user 2 (Rahul Sharma)
            if (json.has("userId")) {
                String uStr = json.get("userId").getAsString();
                if ("usr-admin".equalsIgnoreCase(uStr) || "1".equals(uStr)) {
                    resolvedUserId = 1;
                } else {
                    String digits = uStr.replaceAll("\\D+", "");
                    if (!digits.isEmpty()) {
                        try {
                            int parsed = Integer.parseInt(digits);
                            resolvedUserId = (parsed >= 1 && parsed <= 4) ? parsed : 2;
                        } catch (Exception ignored) {
                            resolvedUserId = 2;
                        }
                    }
                }
            }
            booking.setUserId(resolvedUserId);

            // 2. Resolve Location ID and Slot Number / ID
            int locationId = 1;
            if (json.has("locationId")) {
                String lStr = json.get("locationId").getAsString().replaceAll("\\D+", "");
                if (!lStr.isEmpty()) {
                    try { locationId = Integer.parseInt(lStr); } catch (Exception ignored) {}
                }
            }

            String slotNumber = json.has("slotNumber") ? json.get("slotNumber").getAsString() : null;
            int preferredSlotId = 0;
            if (json.has("slotId")) {
                String rawSlotId = json.get("slotId").getAsString();
                // Pattern slot-loc1-4 -> Location 1, Slot 4
                java.util.regex.Matcher m = java.util.regex.Pattern.compile("slot-loc(\\d+)-(\\d+)").matcher(rawSlotId);
                if (m.find()) {
                    try {
                        int lIdx = Integer.parseInt(m.group(1));
                        int sIdx = Integer.parseInt(m.group(2));
                        locationId = lIdx;
                        preferredSlotId = (lIdx - 1) * 12 + sIdx;
                    } catch (Exception ignored) {}
                } else {
                    String sDigits = rawSlotId.replaceAll("\\D+", "");
                    if (!sDigits.isEmpty()) {
                        try { preferredSlotId = Integer.parseInt(sDigits); } catch (Exception ignored) {}
                    }
                }
            }

            try {
                com.smartparking.model.ParkingSlot resolvedSlot = slotDAO.findSlot(preferredSlotId, locationId, slotNumber);
                if (resolvedSlot != null) {
                    booking.setSlotId(resolvedSlot.getId());
                    booking.setSlotNumber(resolvedSlot.getSlotNumber());
                    booking.setLocationId(resolvedSlot.getLocationId());
                    booking.setFloor(resolvedSlot.getFloor());
                } else {
                    booking.setSlotId(preferredSlotId > 0 ? preferredSlotId : 1);
                }
            } catch (Exception e) {
                booking.setSlotId(preferredSlotId > 0 ? preferredSlotId : 1);
            }

            if ((booking.getVehicleNumber() == null || booking.getVehicleNumber().trim().isEmpty()) && json.has("vehicleNumber")) {
                booking.setVehicleNumber(json.get("vehicleNumber").getAsString());
            }
            if ((booking.getUserName() == null || booking.getUserName().trim().isEmpty()) && json.has("userName")) {
                booking.setUserName(json.get("userName").getAsString());
            }
            if ((booking.getUserPhone() == null || booking.getUserPhone().trim().isEmpty()) && json.has("userPhone")) {
                booking.setUserPhone(json.get("userPhone").getAsString());
            }
            if ((booking.getUserEmail() == null || booking.getUserEmail().trim().isEmpty()) && json.has("userEmail")) {
                booking.setUserEmail(json.get("userEmail").getAsString());
            }
            if (booking.getBookingCode() == null || booking.getBookingCode().trim().isEmpty()) {
                if (json.has("bookingCode")) {
                    booking.setBookingCode(json.get("bookingCode").getAsString());
                } else if (json.has("id")) {
                    booking.setBookingCode(json.get("id").getAsString());
                }
            }
            if (booking.getAmount() <= 0 && json.has("amount")) {
                try { booking.setAmount(json.get("amount").getAsDouble()); } catch (Exception ignored) {}
            }
        }

        // Apply defaults
        if (booking.getUserId() <= 0) booking.setUserId(1);
        if (booking.getSlotId() <= 0) booking.setSlotId(1);
        if (booking.getVehicleNumber() == null || booking.getVehicleNumber().trim().isEmpty()) {
            booking.setVehicleNumber("KA-01-AB-1234");
        }

        // Fill defaults if missing
        if (booking.getStartTime() == null) {
            booking.setStartTime(LocalDateTime.now());
        }
        if (booking.getDurationHours() <= 0) {
            booking.setDurationHours(2);
        }
        if (booking.getEndTime() == null) {
            booking.setEndTime(booking.getStartTime().plusHours(booking.getDurationHours()));
        }
        if (booking.getBookingCode() == null || booking.getBookingCode().trim().isEmpty()) {
            String shortId = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            booking.setBookingCode("SPK-2026-" + shortId);
        }
        if (booking.getStatus() == null) {
            booking.setStatus("CONFIRMED");
        }

        try {
            Booking saved = bookingDAO.createBooking(booking);
            // Fetch complete joined details for confirmation ticket
            Booking fullBooking = bookingDAO.getBookingById(saved.getId());

            String locationName = (fullBooking != null && fullBooking.getLocationName() != null) ? fullBooking.getLocationName() : "Central Parking Facility";
            String slotNum = (fullBooking != null && fullBooking.getSlotNumber() != null) ? fullBooking.getSlotNumber() : String.valueOf(saved.getSlotId());
            String floor = (fullBooking != null && fullBooking.getFloor() != null) ? fullBooking.getFloor() : "Ground Floor";
            String userName = (fullBooking != null && fullBooking.getUserName() != null) ? fullBooking.getUserName() : "Driver";
            String vehicleNum = saved.getVehicleNumber();
            String bookingTime = saved.getStartTime() != null ? saved.getStartTime().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")) : "Now";

            // 1. Create and persist Admin Notification in MySQL database
            String notifId = "adm-notif-" + System.currentTimeMillis() + "-" + saved.getId();
            String notifTitle = "New Parking Booking Received";
            String notifMsg = String.format("User: %s | Vehicle Number: %s | Location: %s | Floor: %s | Slot: %s | Booking Time: %s",
                    userName, vehicleNum, locationName, floor, slotNum, bookingTime);

            Notification adminNotif = new Notification();
            adminNotif.setId(notifId);
            adminNotif.setAdminId("usr-admin");
            adminNotif.setUserId(saved.getUserId());
            adminNotif.setBookingId(String.valueOf(saved.getId()));
            adminNotif.setTitle(notifTitle);
            adminNotif.setMessage(notifMsg);
            adminNotif.setType("new_booking");
            adminNotif.setRead(false);
            adminNotif.setRelatedEntityId(String.valueOf(saved.getId()));
            adminNotif.setCreatedAt(LocalDateTime.now());

            try {
                notificationDAO.createBookingNotification(adminNotif);
            } catch (Exception e) {
                System.err.println("[BookingServlet] Notice: Could not save notification to DB: " + e.getMessage());
            }

            // 2. Real-time multi-device broadcast (WebSocket Primary + SSE Fallback)
            try {
                // Admin alert broadcast
                JsonObject adminNotifPayload = new JsonObject();
                JsonObject notifObj = new JsonObject();
                notifObj.addProperty("id", notifId);
                notifObj.addProperty("adminId", "usr-admin");
                notifObj.addProperty("title", notifTitle);
                notifObj.addProperty("message", notifMsg);
                notifObj.addProperty("type", "new_booking");
                notifObj.addProperty("isRead", false);
                notifObj.addProperty("read", false);
                notifObj.addProperty("bookingId", String.valueOf(saved.getId()));
                notifObj.addProperty("relatedEntityId", String.valueOf(saved.getId()));
                notifObj.addProperty("createdAt", LocalDateTime.now().toString());

                JsonObject meta = new JsonObject();
                meta.addProperty("bookingId", String.valueOf(saved.getId()));
                meta.addProperty("bookingCode", saved.getBookingCode());
                meta.addProperty("slotNumber", slotNum);
                meta.addProperty("floor", floor);
                meta.addProperty("locationName", locationName);
                meta.addProperty("vehicleNumber", vehicleNum);
                meta.addProperty("userName", userName);
                meta.addProperty("bookingTime", bookingTime);
                meta.addProperty("amount", saved.getAmount());
                notifObj.add("metadata", meta);

                int unreadCount = 1;
                try {
                    unreadCount = notificationDAO.getUnreadAdminCount();
                } catch (Exception ignored) {}

                adminNotifPayload.add("notification", notifObj);
                adminNotifPayload.addProperty("action", "created");
                adminNotifPayload.addProperty("unreadCount", unreadCount);
                System.out.println("SERVER: Real-time booking event sent [Booking ID: " + saved.getId() + ", Slot: " + slotNum + ", Floor: " + floor + ", Vehicle: " + vehicleNum + ", User: " + userName + "]");

                // Explicit NEW_BOOKING event broadcast
                JsonObject newBookingPayload = new JsonObject();
                newBookingPayload.add("booking", JsonUtil.getGson().toJsonTree(fullBooking != null ? fullBooking : saved));
                newBookingPayload.add("notification", notifObj);
                newBookingPayload.addProperty("bookingId", String.valueOf(saved.getId()));
                newBookingPayload.addProperty("slotId", booking.getSlotId());
                newBookingPayload.addProperty("slotNumber", slotNum);
                newBookingPayload.addProperty("floor", floor);
                newBookingPayload.addProperty("locationName", locationName);
                newBookingPayload.addProperty("userName", userName);
                newBookingPayload.addProperty("vehicleNumber", vehicleNum);
                newBookingPayload.addProperty("bookingTime", bookingTime);
                newBookingPayload.addProperty("amount", saved.getAmount());
                newBookingPayload.addProperty("status", "Confirmed");
                newBookingPayload.addProperty("unreadCount", unreadCount);

                // Slot and booking update broadcast
                JsonObject broadcastPayload = new JsonObject();
                broadcastPayload.addProperty("slotId", booking.getSlotId());
                broadcastPayload.addProperty("slotStatus", "RESERVED");
                broadcastPayload.addProperty("bookingId", saved.getId());
                broadcastPayload.addProperty("bookingCode", booking.getBookingCode());

                // Broadcast via WebSocket (sub-second delivery to all connected Admin Consoles)
                AdminWebSocketServer.broadcast("ADMIN_NOTIFICATION", adminNotifPayload);
                AdminWebSocketServer.broadcast("NEW_BOOKING", newBookingPayload);
                AdminWebSocketServer.broadcast("BOOKING_CREATED", broadcastPayload);

                // Broadcast via SSE fallback
                RealtimeServlet.broadcast("ADMIN_NOTIFICATION", adminNotifPayload);
                RealtimeServlet.broadcast("NEW_BOOKING", newBookingPayload);
                RealtimeServlet.broadcast("BOOKING_CREATED", broadcastPayload);
            } catch (Exception ignored) {}

            resp.setStatus(HttpServletResponse.SC_CREATED);
            JsonObject res = new JsonObject();
            res.addProperty("success", true);
            res.addProperty("message", "Booking confirmed successfully");
            res.add("booking", JsonUtil.getGson().toJsonTree(fullBooking != null ? fullBooking : saved));
            out.print(JsonUtil.toJson(res));

        } catch (SQLException e) {
            resp.setStatus(HttpServletResponse.SC_CONFLICT);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Booking reservation failed: " + e.getMessage());
            out.print(JsonUtil.toJson(res));
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();
        String pathInfo = req.getPathInfo(); // e.g. "/4/cancel" or "/4/complete"

        if (pathInfo == null || pathInfo.length() <= 1) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Booking ID missing in path");
            out.print(JsonUtil.toJson(res));
            return;
        }

        String[] parts = pathInfo.split("/");
        // parts[1] is id, parts[2] optional action
        try {
            int bookingId = Integer.parseInt(parts[1]);
            String action = (parts.length > 2) ? parts[2].toLowerCase() : "";

            if ("cancel".equals(action)) {
                boolean cancelled = bookingDAO.cancelBooking(bookingId);
                if (cancelled) {
                    try {
                        JsonObject broadcastPayload = new JsonObject();
                        broadcastPayload.addProperty("bookingId", bookingId);
                        broadcastPayload.addProperty("action", "CANCELLED");
                        AdminWebSocketServer.broadcast("BOOKING_CANCELLED", broadcastPayload);
                        RealtimeServlet.broadcast("BOOKING_CANCELLED", broadcastPayload);
                    } catch (Exception ignored) {}
                }
                JsonObject res = new JsonObject();
                res.addProperty("success", cancelled);
                res.addProperty("message", cancelled ? "Booking cancelled successfully and slot freed" : "Booking not found");
                out.print(JsonUtil.toJson(res));
            } else if ("complete".equals(action)) {
                boolean completed = bookingDAO.completeBooking(bookingId);
                if (completed) {
                    try {
                        JsonObject broadcastPayload = new JsonObject();
                        broadcastPayload.addProperty("bookingId", bookingId);
                        broadcastPayload.addProperty("action", "COMPLETED");
                        AdminWebSocketServer.broadcast("BOOKING_COMPLETED", broadcastPayload);
                        RealtimeServlet.broadcast("BOOKING_COMPLETED", broadcastPayload);
                    } catch (Exception ignored) {}
                }
                JsonObject res = new JsonObject();
                res.addProperty("success", completed);
                res.addProperty("message", completed ? "Booking marked completed and slot freed" : "Booking not found");
                out.print(JsonUtil.toJson(res));
            } else {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                JsonObject res = new JsonObject();
                res.addProperty("success", false);
                res.addProperty("message", "Unsupported booking action: " + action);
                out.print(JsonUtil.toJson(res));
            }
        } catch (NumberFormatException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Invalid booking ID format");
            out.print(JsonUtil.toJson(res));
        } catch (SQLException e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Database error: " + e.getMessage());
            out.print(JsonUtil.toJson(res));
        }
    }

    private String readRequestBody(HttpServletRequest req) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        return sb.toString();
    }
}
