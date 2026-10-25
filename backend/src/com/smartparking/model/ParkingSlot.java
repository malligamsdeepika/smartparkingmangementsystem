package com.smartparking.model;

/**
 * Model class representing an individual Parking Slot (Bay).
 */
public class ParkingSlot {
    private int id;
    private int locationId;
    private String slotNumber;
    private String floor;
    private String slotType;     // "REGULAR", "EV", "DISABLED"
    private String vehicleType;  // "BIKE", "CAR", "SUV"
    private String status;       // "AVAILABLE", "RESERVED", "OCCUPIED", "MAINTENANCE"
    private double hourlyRate;

    // Optional location name for display joins
    private String locationName;

    public ParkingSlot() {
        this.slotType = "REGULAR";
        this.vehicleType = "CAR";
        this.status = "AVAILABLE";
        this.floor = "Ground Floor";
        this.hourlyRate = 20.00;
    }

    public ParkingSlot(int id, int locationId, String slotNumber, String floor, String slotType, String vehicleType, String status, double hourlyRate) {
        this.id = id;
        this.locationId = locationId;
        this.slotNumber = slotNumber;
        this.floor = floor;
        this.slotType = slotType;
        this.vehicleType = vehicleType;
        this.status = status;
        this.hourlyRate = hourlyRate;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getLocationId() {
        return locationId;
    }

    public void setLocationId(int locationId) {
        this.locationId = locationId;
    }

    public String getSlotNumber() {
        return slotNumber;
    }

    public void setSlotNumber(String slotNumber) {
        this.slotNumber = slotNumber;
    }

    public String getFloor() {
        return floor;
    }

    public void setFloor(String floor) {
        this.floor = floor;
    }

    public String getSlotType() {
        return slotType;
    }

    public void setSlotType(String slotType) {
        this.slotType = slotType;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public double getHourlyRate() {
        return hourlyRate;
    }

    public void setHourlyRate(double hourlyRate) {
        this.hourlyRate = hourlyRate;
    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public boolean isAvailable() {
        return "AVAILABLE".equalsIgnoreCase(this.status);
    }

    @Override
    public String toString() {
        return "ParkingSlot{" +
                "id=" + id +
                ", locationId=" + locationId +
                ", slotNumber='" + slotNumber + '\'' +
                ", floor='" + floor + '\'' +
                ", slotType='" + slotType + '\'' +
                ", vehicleType='" + vehicleType + '\'' +
                ", status='" + status + '\'' +
                ", hourlyRate=" + hourlyRate +
                '}';
    }
}
