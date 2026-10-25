package com.smartparking.model;

import java.time.LocalDateTime;

/**
 * Immutable audit log record for security, administrative tracking, and compliance.
 */
public class AuditLog {
    private int id;
    private Integer userId;
    private String action; // LOGIN, LOGOUT, REGISTER, CREATE_BOOKING, CANCEL_BOOKING, PAYMENT, CHECK_IN, CHECK_OUT, CREATE_SLOT, UPDATE_SLOT, DELETE_SLOT, UPDATE_PRICING
    private String entityType;
    private Integer entityId;
    private String description;
    private String ipAddress;
    private LocalDateTime createdAt;

    // Optional user name populated via join
    private String userName;

    public AuditLog() {}

    public AuditLog(int id, Integer userId, String action, String entityType, Integer entityId, String description, String ipAddress) {
        this.id = id;
        this.userId = userId;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.description = description;
        this.ipAddress = ipAddress;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public Integer getEntityId() { return entityId; }
    public void setEntityId(Integer entityId) { this.entityId = entityId; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
}
