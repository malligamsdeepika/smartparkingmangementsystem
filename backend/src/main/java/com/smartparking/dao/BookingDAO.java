package com.smartparking.dao;

import com.smartparking.model.Booking;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object (DAO) for Booking operations.
 * Implements ACID transaction rollback and pessimistic row locking to prevent double-booking.
 */
public class BookingDAO {

    /**
     * Creates a new booking with ACID transaction rollback and pessimistic locking (SELECT FOR UPDATE).
     */
    public Booking createBooking(Booking booking) throws SQLException {
        Connection conn = null;
        PreparedStatement checkStmt = null;
        PreparedStatement insertStmt = null;
        PreparedStatement updateSlotStmt = null;
        ResultSet rs = null;

        String lockSlotSql = "SELECT status FROM parking_slots WHERE id = ? FOR UPDATE";
        String insertBookingSql = "INSERT INTO bookings (user_id, slot_id, vehicle_number, vehicle_type, start_time, end_time, duration_hours, amount, status, booking_code, created_at) " +
                                  "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        String updateSlotSql = "UPDATE parking_slots SET status = 'RESERVED' WHERE id = ?";

        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false); // Start Transaction

            // 1. Lock slot row and verify availability
            checkStmt = conn.prepareStatement(lockSlotSql);
            checkStmt.setInt(1, booking.getSlotId());
            rs = checkStmt.executeQuery();

            if (!rs.next()) {
                throw new SQLException("Slot not found: ID " + booking.getSlotId());
            }

            String currentStatus = rs.getString("status");
            if (!"AVAILABLE".equalsIgnoreCase(currentStatus)) {
                throw new SQLException("Slot is no longer available (current status: " + currentStatus + "). Double-booking prevented.");
            }

            // 2. Insert Booking record
            insertStmt = conn.prepareStatement(insertBookingSql, Statement.RETURN_GENERATED_KEYS);
            insertStmt.setInt(1, booking.getUserId());
            insertStmt.setInt(2, booking.getSlotId());
            insertStmt.setString(3, booking.getVehicleNumber().toUpperCase());
            insertStmt.setString(4, booking.getVehicleType());
            insertStmt.setTimestamp(5, Timestamp.valueOf(booking.getStartTime()));
            insertStmt.setTimestamp(6, Timestamp.valueOf(booking.getEndTime()));
            insertStmt.setInt(7, booking.getDurationHours());
            insertStmt.setDouble(8, booking.getAmount());
            insertStmt.setString(9, (booking.getStatus() != null) ? booking.getStatus() : "CONFIRMED");
            insertStmt.setString(10, booking.getBookingCode());
            insertStmt.setTimestamp(11, Timestamp.valueOf(booking.getCreatedAt() != null ? booking.getCreatedAt() : LocalDateTime.now()));

            int rows = insertStmt.executeUpdate();
            if (rows == 0) {
                throw new SQLException("Failed to insert booking record.");
            }

            rs.close();
            rs = insertStmt.getGeneratedKeys();
            if (rs.next()) {
                booking.setId(rs.getInt(1));
            }

            // 3. Mark Slot as RESERVED
            updateSlotStmt = conn.prepareStatement(updateSlotSql);
            updateSlotStmt.setInt(1, booking.getSlotId());
            updateSlotStmt.executeUpdate();

            // Commit atomic transaction
            conn.commit();
            return booking;

        } catch (SQLException e) {
            if (conn != null) {
                try {
                    conn.rollback();
                    System.err.println("[BookingDAO] Transaction rolled back due to error: " + e.getMessage());
                } catch (SQLException ex) {
                    ex.printStackTrace();
                }
            }
            throw e;
        } finally {
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);
                } catch (SQLException ignored) {}
            }
            DBConnection.closeResources(rs, checkStmt, conn);
            if (insertStmt != null) {
                try { insertStmt.close(); } catch (SQLException ignored) {}
            }
            if (updateSlotStmt != null) {
                try { updateSlotStmt.close(); } catch (SQLException ignored) {}
            }
        }
    }

    /**
     * Retrieves a booking by primary key ID with joined user, slot, and location details.
     */
    public Booking getBookingById(int id) throws SQLException {
        String sql = "SELECT b.*, u.name as user_name, u.email as user_email, u.phone as user_phone, " +
                     "s.slot_number, s.floor, l.name as location_name " +
                     "FROM bookings b " +
                     "JOIN users u ON b.user_id = u.id " +
                     "JOIN parking_slots s ON b.slot_id = s.id " +
                     "JOIN parking_locations l ON s.location_id = l.id " +
                     "WHERE b.id = ?";
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql);
            stmt.setInt(1, id);
            rs = stmt.executeQuery();

            if (rs.next()) {
                return mapResultSetToBooking(rs);
            }
            return null;
        } finally {
            DBConnection.closeResources(rs, stmt, conn);
        }
    }

    /**
     * Retrieves a booking by unique booking code (e.g. for QR Code gate verification).
     */
    public Booking getBookingByCode(String bookingCode) throws SQLException {
        String sql = "SELECT b.*, u.name as user_name, u.email as user_email, u.phone as user_phone, " +
                     "s.slot_number, s.floor, l.name as location_name " +
                     "FROM bookings b " +
                     "JOIN users u ON b.user_id = u.id " +
                     "JOIN parking_slots s ON b.slot_id = s.id " +
                     "JOIN parking_locations l ON s.location_id = l.id " +
                     "WHERE b.booking_code = ?";
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql);
            stmt.setString(1, bookingCode.trim());
            rs = stmt.executeQuery();

            if (rs.next()) {
                return mapResultSetToBooking(rs);
            }
            return null;
        } finally {
            DBConnection.closeResources(rs, stmt, conn);
        }
    }

    /**
     * Retrieves all bookings for a specific user ID.
     */
    public List<Booking> getBookingsByUserId(int userId) throws SQLException {
        String sql = "SELECT b.*, u.name as user_name, u.email as user_email, u.phone as user_phone, " +
                     "s.slot_number, s.floor, l.name as location_name " +
                     "FROM bookings b " +
                     "JOIN users u ON b.user_id = u.id " +
                     "JOIN parking_slots s ON b.slot_id = s.id " +
                     "JOIN parking_locations l ON s.location_id = l.id " +
                     "WHERE b.user_id = ? " +
                     "ORDER BY b.created_at DESC";
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        List<Booking> list = new ArrayList<>();

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql);
            stmt.setInt(1, userId);
            rs = stmt.executeQuery();

            while (rs.next()) {
                list.add(mapResultSetToBooking(rs));
            }
            return list;
        } finally {
            DBConnection.closeResources(rs, stmt, conn);
        }
    }

    /**
     * Retrieves all bookings in the system (for Admin Dashboard).
     */
    public List<Booking> getAllBookings() throws SQLException {
        String sql = "SELECT b.*, u.name as user_name, u.email as user_email, u.phone as user_phone, " +
                     "s.slot_number, s.floor, l.name as location_name " +
                     "FROM bookings b " +
                     "JOIN users u ON b.user_id = u.id " +
                     "JOIN parking_slots s ON b.slot_id = s.id " +
                     "JOIN parking_locations l ON s.location_id = l.id " +
                     "ORDER BY b.created_at DESC";
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        List<Booking> list = new ArrayList<>();

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql);
            rs = stmt.executeQuery();

            while (rs.next()) {
                list.add(mapResultSetToBooking(rs));
            }
            return list;
        } finally {
            DBConnection.closeResources(rs, stmt, conn);
        }
    }

    /**
     * Cancels a booking and resets the slot status to AVAILABLE.
     */
    public boolean cancelBooking(int bookingId) throws SQLException {
        Connection conn = null;
        PreparedStatement getSlotStmt = null;
        PreparedStatement cancelStmt = null;
        PreparedStatement freeSlotStmt = null;
        ResultSet rs = null;

        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false);

            // Get slot ID of booking
            getSlotStmt = conn.prepareStatement("SELECT slot_id, status FROM bookings WHERE id = ? FOR UPDATE");
            getSlotStmt.setInt(1, bookingId);
            rs = getSlotStmt.executeQuery();

            if (!rs.next()) {
                throw new SQLException("Booking not found: ID " + bookingId);
            }

            int slotId = rs.getInt("slot_id");
            String status = rs.getString("status");

            if ("CANCELLED".equalsIgnoreCase(status)) {
                return true; // Already cancelled
            }

            // Update booking status
            cancelStmt = conn.prepareStatement("UPDATE bookings SET status = 'CANCELLED' WHERE id = ?");
            cancelStmt.setInt(1, bookingId);
            cancelStmt.executeUpdate();

            // Free the slot
            freeSlotStmt = conn.prepareStatement("UPDATE parking_slots SET status = 'AVAILABLE' WHERE id = ?");
            freeSlotStmt.setInt(1, slotId);
            freeSlotStmt.executeUpdate();

            conn.commit();
            return true;
        } catch (SQLException e) {
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ignored) {}
            }
            throw e;
        } finally {
            if (conn != null) {
                try { conn.setAutoCommit(true); } catch (SQLException ignored) {}
            }
            DBConnection.closeResources(rs, getSlotStmt, conn);
            if (cancelStmt != null) { try { cancelStmt.close(); } catch (SQLException ignored) {} }
            if (freeSlotStmt != null) { try { freeSlotStmt.close(); } catch (SQLException ignored) {} }
        }
    }

    /**
     * Marks a booking as COMPLETED and frees the slot.
     */
    public boolean completeBooking(int bookingId) throws SQLException {
        Connection conn = null;
        PreparedStatement stmt1 = null;
        PreparedStatement stmt2 = null;
        ResultSet rs = null;

        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false);

            stmt1 = conn.prepareStatement("SELECT slot_id FROM bookings WHERE id = ?");
            stmt1.setInt(1, bookingId);
            rs = stmt1.executeQuery();

            if (!rs.next()) {
                return false;
            }
            int slotId = rs.getInt("slot_id");

            stmt2 = conn.prepareStatement("UPDATE bookings SET status = 'COMPLETED' WHERE id = ?");
            stmt2.setInt(1, bookingId);
            stmt2.executeUpdate();

            PreparedStatement freeStmt = conn.prepareStatement("UPDATE parking_slots SET status = 'AVAILABLE' WHERE id = ?");
            freeStmt.setInt(1, slotId);
            freeStmt.executeUpdate();
            freeStmt.close();

            conn.commit();
            return true;
        } catch (SQLException e) {
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ignored) {}
            }
            throw e;
        } finally {
            if (conn != null) {
                try { conn.setAutoCommit(true); } catch (SQLException ignored) {}
            }
            DBConnection.closeResources(rs, stmt1, conn);
            if (stmt2 != null) { try { stmt2.close(); } catch (SQLException ignored) {} }
        }
    }

    // Helper mapper
    private Booking mapResultSetToBooking(ResultSet rs) throws SQLException {
        Booking b = new Booking();
        b.setId(rs.getInt("id"));
        b.setUserId(rs.getInt("user_id"));
        b.setSlotId(rs.getInt("slot_id"));
        b.setVehicleNumber(rs.getString("vehicle_number"));
        b.setVehicleType(rs.getString("vehicle_type"));
        
        Timestamp st = rs.getTimestamp("start_time");
        if (st != null) b.setStartTime(st.toLocalDateTime());

        Timestamp et = rs.getTimestamp("end_time");
        if (et != null) b.setEndTime(et.toLocalDateTime());

        b.setDurationHours(rs.getInt("duration_hours"));
        b.setAmount(rs.getDouble("amount"));
        b.setStatus(rs.getString("status"));
        b.setBookingCode(rs.getString("booking_code"));

        Timestamp ct = rs.getTimestamp("created_at");
        if (ct != null) b.setCreatedAt(ct.toLocalDateTime());

        b.setUserName(rs.getString("user_name"));
        b.setUserEmail(rs.getString("user_email"));
        b.setUserPhone(rs.getString("user_phone"));
        b.setSlotNumber(rs.getString("slot_number"));
        b.setFloor(rs.getString("floor"));
        b.setLocationName(rs.getString("location_name"));

        return b;
    }
}
