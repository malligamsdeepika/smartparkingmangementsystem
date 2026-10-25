package com.smartparking.dao;

import com.smartparking.model.Notification;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object (DAO) for Notification entity.
 * Handles MySQL persistence, duplicate prevention for bookings, and admin alert queries.
 */
public class NotificationDAO {

    /**
     * Creates an admin notification for a new booking with duplicate prevention.
     * Prevents duplicate alerts if the same booking is processed multiple times.
     */
    public boolean createBookingNotification(Notification notif) throws SQLException {
        Connection conn = null;
        PreparedStatement checkStmt = null;
        PreparedStatement insertStmt = null;
        ResultSet rs = null;

        String checkSql = "SELECT id FROM notifications WHERE booking_id = ? AND type = ? LIMIT 1";
        String insertSql = "INSERT INTO notifications (id, admin_id, user_id, booking_id, title, message, type, is_read, related_entity_id, created_at) " +
                          "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try {
            conn = DBConnection.getConnection();

            // 1. Check for duplicate notification by bookingId and type
            if (notif.getBookingId() != null && !notif.getBookingId().trim().isEmpty()) {
                checkStmt = conn.prepareStatement(checkSql);
                checkStmt.setString(1, notif.getBookingId().trim());
                checkStmt.setString(2, notif.getType());
                rs = checkStmt.executeQuery();
                if (rs.next()) {
                    // Duplicate prevented
                    return false;
                }
            }

            // 2. Insert new notification
            insertStmt = conn.prepareStatement(insertSql);
            insertStmt.setString(1, notif.getId());
            insertStmt.setString(2, notif.getAdminId() != null ? notif.getAdminId() : "usr-admin");
            insertStmt.setInt(3, notif.getUserId());
            insertStmt.setString(4, notif.getBookingId());
            insertStmt.setString(5, notif.getTitle());
            insertStmt.setString(6, notif.getMessage());
            insertStmt.setString(7, notif.getType() != null ? notif.getType() : "new_booking");
            insertStmt.setBoolean(8, notif.isRead());
            insertStmt.setString(9, notif.getRelatedEntityId() != null ? notif.getRelatedEntityId() : notif.getBookingId());
            LocalDateTime created = notif.getCreatedAt() != null ? notif.getCreatedAt() : LocalDateTime.now();
            insertStmt.setTimestamp(10, Timestamp.valueOf(created));

            int affected = insertStmt.executeUpdate();
            return affected > 0;

        } catch (SQLException e) {
            // If unique key violation, treat as safe duplicate suppression
            if (e.getErrorCode() == 1062 || (e.getMessage() != null && e.getMessage().contains("Duplicate"))) {
                return false;
            }
            throw e;
        } finally {
            DBConnection.closeResources(rs, checkStmt, conn);
            if (insertStmt != null) {
                try { insertStmt.close(); } catch (SQLException ignored) {}
            }
        }
    }

    /**
     * Retrieves all administrator notifications with optional filter (all/unread).
     */
    public List<Notification> getAdminNotifications(String filter, String type, int limit) throws SQLException {
        StringBuilder sql = new StringBuilder("SELECT * FROM notifications WHERE 1=1 ");
        List<Object> params = new ArrayList<>();

        if ("unread".equalsIgnoreCase(filter)) {
            sql.append("AND is_read = false ");
        }
        if (type != null && !type.trim().isEmpty() && !"all".equalsIgnoreCase(type)) {
            sql.append("AND type = ? ");
            params.add(type.trim());
        }

        sql.append("ORDER BY created_at DESC LIMIT ?");
        params.add(limit > 0 ? limit : 50);

        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        List<Notification> list = new ArrayList<>();

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql.toString());
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }
            rs = stmt.executeQuery();

            while (rs.next()) {
                Notification n = new Notification();
                n.setId(rs.getString("id"));
                n.setAdminId(rs.getString("admin_id"));
                n.setUserId(rs.getInt("user_id"));
                n.setBookingId(rs.getString("booking_id"));
                n.setTitle(rs.getString("title"));
                n.setMessage(rs.getString("message"));
                n.setType(rs.getString("type"));
                n.setRead(rs.getBoolean("is_read"));
                n.setRelatedEntityId(rs.getString("related_entity_id"));
                Timestamp ts = rs.getTimestamp("created_at");
                if (ts != null) {
                    n.setCreatedAt(ts.toLocalDateTime());
                    n.setCreatedAtIso(ts.toInstant().toString());
                }
                list.add(n);
            }
            return list;
        } finally {
            DBConnection.closeResources(rs, stmt, conn);
        }
    }

    /**
     * Gets the count of unread administrator notifications.
     */
    public int getUnreadAdminCount() throws SQLException {
        String sql = "SELECT COUNT(*) FROM notifications WHERE is_read = false";
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql);
            rs = stmt.executeQuery();
            if (rs.next()) {
                return rs.getInt(1);
            }
            return 0;
        } finally {
            DBConnection.closeResources(rs, stmt, conn);
        }
    }

    /**
     * Marks a specific notification as read.
     */
    public boolean markAsRead(String id) throws SQLException {
        String sql = "UPDATE notifications SET is_read = true WHERE id = ?";
        Connection conn = null;
        PreparedStatement stmt = null;

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql);
            stmt.setString(1, id);
            return stmt.executeUpdate() > 0;
        } finally {
            DBConnection.closeResources(null, stmt, conn);
        }
    }

    /**
     * Marks all administrator notifications as read.
     */
    public int markAllAsRead() throws SQLException {
        String sql = "UPDATE notifications SET is_read = true WHERE is_read = false";
        Connection conn = null;
        PreparedStatement stmt = null;

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql);
            return stmt.executeUpdate();
        } finally {
            DBConnection.closeResources(null, stmt, conn);
        }
    }
}
