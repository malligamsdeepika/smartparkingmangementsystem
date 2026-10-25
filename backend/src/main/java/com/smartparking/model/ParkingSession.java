package com.smartparking.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Represents the physical vehicle check-in and check-out session recorded by gate operators or sensors.
 */
public class ParkingSession {
    private int id;
    private int bookingId;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private Integer actualDuration; // in minutes
    private BigDecimal finalAmount;
    private String status; // ACTIVE, COMPLETED, OVERSTAY
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ParkingSession() {}

    public ParkingSession(int id, int bookingId, LocalDateTime entryTime, LocalDateTime exitTime, Integer actualDuration, BigDecimal finalAmount, String status) {
        this.id = id;
        this.bookingId = bookingId;
        this.entryTime = entryTime;
        this.exitTime = exitTime;
        this.actualDuration = actualDuration;
        this.finalAmount = finalAmount;
        this.status = status;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getBookingId() { return bookingId; }
    public void setBookingId(int bookingId) { this.bookingId = bookingId; }

    public LocalDateTime getEntryTime() { return entryTime; }
    public void setEntryTime(LocalDateTime entryTime) { this.entryTime = entryTime; }

    public LocalDateTime getExitTime() { return exitTime; }
    public void setExitTime(LocalDateTime exitTime) { this.exitTime = exitTime; }

    public Integer getActualDuration() { return actualDuration; }
    public void setActualDuration(Integer actualDuration) { this.actualDuration = actualDuration; }

    public BigDecimal getFinalAmount() { return finalAmount; }
    public void setFinalAmount(BigDecimal finalAmount) { this.finalAmount = finalAmount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
