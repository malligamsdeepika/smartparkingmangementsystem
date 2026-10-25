package com.smartparking.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Represents an Electric Vehicle charging station unit mounted at an EV slot.
 */
public class EVCharger {
    private int id;
    private int slotId;
    private String chargerType;     // CCS-2 FAST DC, TYPE-2 AC FAST, etc.
    private String chargingStatus;  // IDLE, CHARGING, COMPLETED, OUT_OF_SERVICE
    private BigDecimal pricePerKwh;
    private BigDecimal totalPowerOutputKw;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public EVCharger() {}

    public EVCharger(int id, int slotId, String chargerType, String chargingStatus, BigDecimal pricePerKwh, BigDecimal totalPowerOutputKw) {
        this.id = id;
        this.slotId = slotId;
        this.chargerType = chargerType;
        this.chargingStatus = chargingStatus;
        this.pricePerKwh = pricePerKwh;
        this.totalPowerOutputKw = totalPowerOutputKw;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getSlotId() { return slotId; }
    public void setSlotId(int slotId) { this.slotId = slotId; }

    public String getChargerType() { return chargerType; }
    public void setChargerType(String chargerType) { this.chargerType = chargerType; }

    public String getChargingStatus() { return chargingStatus; }
    public void setChargingStatus(String chargingStatus) { this.chargingStatus = chargingStatus; }

    public BigDecimal getPricePerKwh() { return pricePerKwh; }
    public void setPricePerKwh(BigDecimal pricePerKwh) { this.pricePerKwh = pricePerKwh; }

    public BigDecimal getTotalPowerOutputKw() { return totalPowerOutputKw; }
    public void setTotalPowerOutputKw(BigDecimal totalPowerOutputKw) { this.totalPowerOutputKw = totalPowerOutputKw; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
