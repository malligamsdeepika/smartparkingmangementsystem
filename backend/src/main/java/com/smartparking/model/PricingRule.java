package com.smartparking.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Represents dynamic pricing tiers based on parking facility occupancy and temporal rules.
 */
public class PricingRule {
    private int id;
    private Integer locationId; // Nullable for global base rules
    private String ruleName;
    private BigDecimal minOccupancyPct;
    private BigDecimal maxOccupancyPct;
    private BigDecimal baseHourlyRate;
    private BigDecimal peakHourMultiplier;
    private BigDecimal weekendMultiplier;
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public PricingRule() {}

    public PricingRule(int id, Integer locationId, String ruleName, BigDecimal minOccupancyPct, BigDecimal maxOccupancyPct, BigDecimal baseHourlyRate, BigDecimal peakHourMultiplier, BigDecimal weekendMultiplier, boolean isActive) {
        this.id = id;
        this.locationId = locationId;
        this.ruleName = ruleName;
        this.minOccupancyPct = minOccupancyPct;
        this.maxOccupancyPct = maxOccupancyPct;
        this.baseHourlyRate = baseHourlyRate;
        this.peakHourMultiplier = peakHourMultiplier;
        this.weekendMultiplier = weekendMultiplier;
        this.isActive = isActive;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public Integer getLocationId() { return locationId; }
    public void setLocationId(Integer locationId) { this.locationId = locationId; }

    public String getRuleName() { return ruleName; }
    public void setRuleName(String ruleName) { this.ruleName = ruleName; }

    public BigDecimal getMinOccupancyPct() { return minOccupancyPct; }
    public void setMinOccupancyPct(BigDecimal minOccupancyPct) { this.minOccupancyPct = minOccupancyPct; }

    public BigDecimal getMaxOccupancyPct() { return maxOccupancyPct; }
    public void setMaxOccupancyPct(BigDecimal maxOccupancyPct) { this.maxOccupancyPct = maxOccupancyPct; }

    public BigDecimal getBaseHourlyRate() { return baseHourlyRate; }
    public void setBaseHourlyRate(BigDecimal baseHourlyRate) { this.baseHourlyRate = baseHourlyRate; }

    public BigDecimal getPeakHourMultiplier() { return peakHourMultiplier; }
    public void setPeakHourMultiplier(BigDecimal peakHourMultiplier) { this.peakHourMultiplier = peakHourMultiplier; }

    public BigDecimal getWeekendMultiplier() { return weekendMultiplier; }
    public void setWeekendMultiplier(BigDecimal weekendMultiplier) { this.weekendMultiplier = weekendMultiplier; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
