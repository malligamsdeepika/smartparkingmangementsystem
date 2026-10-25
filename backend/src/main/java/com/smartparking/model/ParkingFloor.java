package com.smartparking.model;

import java.time.LocalDateTime;

/**
 * Represents a floor/level in a parking facility.
 */
public class ParkingFloor {
    private int id;
    private int locationId;
    private String floorName;
    private int floorNumber;
    private int totalSlots;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ParkingFloor() {}

    public ParkingFloor(int id, int locationId, String floorName, int floorNumber, int totalSlots) {
        this.id = id;
        this.locationId = locationId;
        this.floorName = floorName;
        this.floorNumber = floorNumber;
        this.totalSlots = totalSlots;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getLocationId() { return locationId; }
    public void setLocationId(int locationId) { this.locationId = locationId; }

    public String getFloorName() { return floorName; }
    public void setFloorName(String floorName) { this.floorName = floorName; }

    public int getFloorNumber() { return floorNumber; }
    public void setFloorNumber(int floorNumber) { this.floorNumber = floorNumber; }

    public int getTotalSlots() { return totalSlots; }
    public void setTotalSlots(int totalSlots) { this.totalSlots = totalSlots; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
