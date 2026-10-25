package com.smartparking.model;

import java.time.LocalDateTime;

/**
 * Represents in-app and administrator notifications dispatched across devices.
 * Supports MySQL columns: notification_id/id, booking_id, message, notification_type/type, is_read, created_at.
 */
public class Notification {
    private String id;
    private String adminId;
    private int userId;
    private String bookingId;
    private String title;
    private String message;
    private String type; // new_booking, booking_cancellation, payment_update, slot_update, etc.
    private boolean isRead;
    private String relatedEntityId;
    private LocalDateTime createdAt;
    private String createdAtIso;

    public Notification() {}

    public Notification(String id, String adminId, String bookingId, String title, String message, String type, boolean isRead) {
        this.id = id;
        this.adminId = adminId;
        this.bookingId = bookingId;
        this.title = title;
        this.message = message;
        this.type = type;
        this.isRead = isRead;
        this.createdAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getNotificationId() { return id; }
    public void setNotificationId(String notificationId) { this.id = notificationId; }

    public String getAdminId() { return adminId; }
    public void setAdminId(String adminId) { this.adminId = adminId; }

    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }

    public String getBookingId() { return bookingId; }
    public void setBookingId(String bookingId) { this.bookingId = bookingId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getNotificationType() { return type; }
    public void setNotificationType(String notificationType) { this.type = notificationType; }

    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }

    public String getRelatedEntityId() { return relatedEntityId; }
    public void setRelatedEntityId(String relatedEntityId) { this.relatedEntityId = relatedEntityId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getCreatedAtIso() { return createdAtIso; }
    public void setCreatedAtIso(String createdAtIso) { this.createdAtIso = createdAtIso; }
}

