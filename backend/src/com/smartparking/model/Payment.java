package com.smartparking.model;

import java.time.LocalDateTime;

/**
 * Model class representing a Payment transaction record.
 */
public class Payment {
    private int id;
    private int bookingId;
    private double amount;
    private String paymentMethod;    // "CASH", "UPI", "CARD"
    private String transactionId;
    private String paymentStatus;    // "PENDING", "SUCCESS", "FAILED"
    private LocalDateTime paidAt;

    public Payment() {
        this.paymentMethod = "UPI";
        this.paymentStatus = "SUCCESS";
        this.paidAt = LocalDateTime.now();
    }

    public Payment(int bookingId, double amount, String paymentMethod, String transactionId, String paymentStatus) {
        this.bookingId = bookingId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.transactionId = transactionId;
        this.paymentStatus = paymentStatus;
        this.paidAt = LocalDateTime.now();
    }

    public Payment(int id, int bookingId, double amount, String paymentMethod, String transactionId, String paymentStatus, LocalDateTime paidAt) {
        this.id = id;
        this.bookingId = bookingId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.transactionId = transactionId;
        this.paymentStatus = paymentStatus;
        this.paidAt = paidAt;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getBookingId() {
        return bookingId;
    }

    public void setBookingId(int bookingId) {
        this.bookingId = bookingId;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }

    @Override
    public String toString() {
        return "Payment{" +
                "id=" + id +
                ", bookingId=" + bookingId +
                ", amount=" + amount +
                ", paymentMethod='" + paymentMethod + '\'' +
                ", transactionId='" + transactionId + '\'' +
                ", paymentStatus='" + paymentStatus + '\'' +
                ", paidAt=" + paidAt +
                '}';
    }
}
