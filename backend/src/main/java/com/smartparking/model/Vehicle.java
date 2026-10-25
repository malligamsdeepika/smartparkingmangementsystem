package com.smartparking.model;

import java.time.LocalDateTime;

/**
 * Represents a motor vehicle registered under a user account.
 */
public class Vehicle {
    private int id;
    private int userId;
    private String vehicleNumber;
    private String vehicleType;  // CAR, BIKE, SUV, EV
    private String vehicleModel;
    private String fuelType;      // PETROL, DIESEL, ELECTRIC, HYBRID, CNG
    private boolean isPrimary;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Vehicle() {}

    public Vehicle(int id, int userId, String vehicleNumber, String vehicleType, String vehicleModel, String fuelType, boolean isPrimary) {
        this.id = id;
        this.userId = userId;
        this.vehicleNumber = vehicleNumber;
        this.vehicleType = vehicleType;
        this.vehicleModel = vehicleModel;
        this.fuelType = fuelType;
        this.isPrimary = isPrimary;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }

    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public String getVehicleModel() { return vehicleModel; }
    public void setVehicleModel(String vehicleModel) { this.vehicleModel = vehicleModel; }

    public String getFuelType() { return fuelType; }
    public void setFuelType(String fuelType) { this.fuelType = fuelType; }

    public boolean isPrimary() { return isPrimary; }
    public void setPrimary(boolean primary) { isPrimary = primary; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
