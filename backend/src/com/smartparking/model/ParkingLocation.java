package com.smartparking.model;

import java.time.LocalDateTime;

/**
 * Model class representing a Parking Location (Facility or Hub).
 */
public class ParkingLocation {
    private int id;
    private String name;
    private String address;
    private String city;
    private int totalSlots;
    private double latitude;
    private double longitude;
    private LocalDateTime createdAt;
    
    // Optional helper fields for live display
    private int availableSlots;
    private double startingRate;

    public ParkingLocation() {
        this.createdAt = LocalDateTime.now();
    }

    public ParkingLocation(int id, String name, String address, String city, int totalSlots, double latitude, double longitude) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.city = city;
        this.totalSlots = totalSlots;
        this.latitude = latitude;
        this.longitude = longitude;
        this.createdAt = LocalDateTime.now();
    }

    public ParkingLocation(int id, String name, String address, String city, int totalSlots, double latitude, double longitude, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.city = city;
        this.totalSlots = totalSlots;
        this.latitude = latitude;
        this.longitude = longitude;
        this.createdAt = createdAt;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public int getTotalSlots() {
        return totalSlots;
    }

    public void setTotalSlots(int totalSlots) {
        this.totalSlots = totalSlots;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public int getAvailableSlots() {
        return availableSlots;
    }

    public void setAvailableSlots(int availableSlots) {
        this.availableSlots = availableSlots;
    }

    public double getStartingRate() {
        return startingRate;
    }

    public void setStartingRate(double startingRate) {
        this.startingRate = startingRate;
    }

    @Override
    public String toString() {
        return "ParkingLocation{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", city='" + city + '\'' +
                ", totalSlots=" + totalSlots +
                ", latitude=" + latitude +
                ", longitude=" + longitude +
                '}';
    }
}
