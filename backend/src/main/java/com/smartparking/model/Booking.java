package com.smartparking.model;

import java.time.LocalDateTime;

/**
 * Model class representing a Parking Slot Booking reservation.
 */
public class Booking {
    private int id;
    private int userId;
    private int slotId;
    private String vehicleNumber;
    private String vehicleType;      // "BIKE", "CAR", "SUV"
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private int durationHours;
    private double amount;
    private String status;           // "CONFIRMED", "CANCELLED", "COMPLETED"
    private String bookingCode;      // e.g., "TPT-2026-8891"
    private LocalDateTime createdAt;

    // Joined helper fields for UI/API rendering
    private String userName;
    private String userEmail;
    private String userPhone;
    private String slotNumber;
    private String locationName;
    private String floor;

    public Booking() {
        this.status = "CONFIRMED";
        this.createdAt = LocalDateTime.now();
    }

    public Booking(int id, int userId, int slotId, String vehicleNumber, String vehicleType,
                   LocalDateTime startTime, LocalDateTime endTime, int durationHours,
                   double amount, String status, String bookingCode, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.slotId = slotId;
        this.vehicleNumber = vehicleNumber;
        this.vehicleType = vehicleType;
        this.startTime = startTime;
        this.endTime = endTime;
        this.durationHours = durationHours;
        this.amount = amount;
        this.status = status;
        this.bookingCode = bookingCode;
        this.createdAt = createdAt;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }

    public int getSlotId() {
        return slotId;
    }

    public void setSlotId(int slotId) {
        this.slotId = slotId;
    }

    public String getVehicleNumber() {
        return vehicleNumber;
    }

    public void setVehicleNumber(String vehicleNumber) {
        this.vehicleNumber = vehicleNumber;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public int getDurationHours() {
        return durationHours;
    }

    public void setDurationHours(int durationHours) {
        this.durationHours = durationHours;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getBookingCode() {
        return bookingCode;
    }

    public void setBookingCode(String bookingCode) {
        this.bookingCode = bookingCode;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getUserPhone() {
        return userPhone;
    }

    public void setUserPhone(String userPhone) {
        this.userPhone = userPhone;
    }

    public String getSlotNumber() {
        return slotNumber;
    }

    public void setSlotNumber(String slotNumber) {
        this.slotNumber = slotNumber;
    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public String getFloor() {
        return floor;
    }

    public void setFloor(String floor) {
        this.floor = floor;
    }

    @Override
    public String toString() {
        return "Booking{" +
                "id=" + id +
                ", userId=" + userId +
                ", slotId=" + slotId +
                ", vehicleNumber='" + vehicleNumber + '\'' +
                ", bookingCode='" + bookingCode + '\'' +
                ", status='" + status + '\'' +
                ", amount=" + amount +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                '}';
    }
}
