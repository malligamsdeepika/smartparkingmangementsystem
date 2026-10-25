package com.smartparking.dao;

import com.smartparking.model.Payment;

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
 * Data Access Object (DAO) for Payment transactions.
 */
public class PaymentDAO {

    /**
     * Records a payment transaction into payments table.
     */
    public Payment processPayment(Payment payment) throws SQLException {
        String sql = "INSERT INTO payments (booking_id, amount, payment_method, transaction_id, payment_status, paid_at) VALUES (?, ?, ?, ?, ?, ?)";
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);

            stmt.setInt(1, payment.getBookingId());
            stmt.setDouble(2, payment.getAmount());
            stmt.setString(3, (payment.getPaymentMethod() != null) ? payment.getPaymentMethod() : "UPI");
            stmt.setString(4, payment.getTransactionId());
            stmt.setString(5, (payment.getPaymentStatus() != null) ? payment.getPaymentStatus() : "SUCCESS");
            stmt.setTimestamp(6, Timestamp.valueOf(payment.getPaidAt() != null ? payment.getPaidAt() : LocalDateTime.now()));

            int rows = stmt.executeUpdate();
            if (rows == 0) {
                throw new SQLException("Recording payment failed, no rows affected.");
            }

            rs = stmt.getGeneratedKeys();
            if (rs.next()) {
                payment.setId(rs.getInt(1));
            }
            return payment;
        } finally {
            DBConnection.closeResources(rs, stmt, conn);
        }
    }

    /**
     * Retrieves payment by associated booking ID.
     */
    public Payment getPaymentByBookingId(int bookingId) throws SQLException {
        String sql = "SELECT id, booking_id, amount, payment_method, transaction_id, payment_status, paid_at FROM payments WHERE booking_id = ?";
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql);
            stmt.setInt(1, bookingId);
            rs = stmt.executeQuery();

            if (rs.next()) {
                Payment p = new Payment();
                p.setId(rs.getInt("id"));
                p.setBookingId(rs.getInt("booking_id"));
                p.setAmount(rs.getDouble("amount"));
                p.setPaymentMethod(rs.getString("payment_method"));
                p.setTransactionId(rs.getString("transaction_id"));
                p.setPaymentStatus(rs.getString("payment_status"));
                Timestamp ts = rs.getTimestamp("paid_at");
                if (ts != null) p.setPaidAt(ts.toLocalDateTime());
                return p;
            }
            return null;
        } finally {
            DBConnection.closeResources(rs, stmt, conn);
        }
    }

    /**
     * Lists all payments (for Admin Revenue analytics).
     */
    public List<Payment> getAllPayments() throws SQLException {
        String sql = "SELECT id, booking_id, amount, payment_method, transaction_id, payment_status, paid_at FROM payments ORDER BY paid_at DESC";
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        List<Payment> list = new ArrayList<>();

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql);
            rs = stmt.executeQuery();

            while (rs.next()) {
                Payment p = new Payment();
                p.setId(rs.getInt("id"));
                p.setBookingId(rs.getInt("booking_id"));
                p.setAmount(rs.getDouble("amount"));
                p.setPaymentMethod(rs.getString("payment_method"));
                p.setTransactionId(rs.getString("transaction_id"));
                p.setPaymentStatus(rs.getString("payment_status"));
                Timestamp ts = rs.getTimestamp("paid_at");
                if (ts != null) p.setPaidAt(ts.toLocalDateTime());
                list.add(p);
            }
            return list;
        } finally {
            DBConnection.closeResources(rs, stmt, conn);
        }
    }
}
