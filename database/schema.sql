-- ====================================================================
-- SMART PARKING MANAGEMENT SYSTEM
-- Target RDBMS: MySQL 8.0+
-- Database: smart_parking
-- College Final Year BCA Project
-- ====================================================================

DROP DATABASE IF EXISTS smart_parking;
CREATE DATABASE smart_parking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_parking;

-- --------------------------------------------------------------------
-- 1. USERS TABLE
-- Stores credentials and user profiles for drivers and administrators.
-- --------------------------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 2. PARKING LOCATIONS TABLE
-- Represents physical parking garages, facilities, and malls.
-- --------------------------------------------------------------------
CREATE TABLE parking_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    total_slots INT NOT NULL DEFAULT 0,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    operating_hours VARCHAR(100) DEFAULT '24/7 All Days',
    landmark VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_location_city (city)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 3. PARKING SLOTS TABLE
-- Individual bays with physical floor, vehicle compatibility, and rates.
-- Fields mapped: slot_status (status), expected_available_time
-- --------------------------------------------------------------------
CREATE TABLE parking_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    slot_number VARCHAR(20) NOT NULL,
    floor VARCHAR(20) NOT NULL DEFAULT 'Ground Floor',
    slot_type ENUM('REGULAR', 'EV', 'DISABLED') NOT NULL DEFAULT 'REGULAR',
    vehicle_type ENUM('BIKE', 'CAR', 'SUV') NOT NULL DEFAULT 'CAR',
    status ENUM('AVAILABLE', 'RESERVED', 'OCCUPIED', 'MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
    slot_status ENUM('AVAILABLE', 'RESERVED', 'OCCUPIED', 'MAINTENANCE') GENERATED ALWAYS AS (status) VIRTUAL,
    expected_available_time DATETIME NULL,
    current_vehicle_number VARCHAR(30) NULL,
    hourly_rate DECIMAL(8, 2) NOT NULL DEFAULT 20.00,
    distance_to_entrance_meters INT DEFAULT 25,
    is_shaded BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (location_id) REFERENCES parking_locations(id) ON DELETE CASCADE,
    UNIQUE KEY uq_location_slot (location_id, slot_number),
    INDEX idx_slot_status (status),
    INDEX idx_slot_type (slot_type),
    INDEX idx_slot_vehicle (vehicle_type)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 4. BOOKINGS TABLE
-- Handles slot reservations, vehicle details, duration, and access codes.
-- Fields mapped:
--   booking_id (id), slot_id, vehicle_number, booking_start_time (start_time),
--   expected_exit_time (end_time), actual_entry_time, actual_exit_time,
--   booking_duration (duration_hours), booking_status (status), slot_status
-- --------------------------------------------------------------------
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT GENERATED ALWAYS AS (id) VIRTUAL,
    user_id INT NOT NULL,
    slot_id INT NOT NULL,
    vehicle_number VARCHAR(30) NOT NULL,
    vehicle_type ENUM('BIKE', 'CAR', 'SUV') NOT NULL DEFAULT 'CAR',
    booking_start_time DATETIME NOT NULL,
    expected_exit_time DATETIME NOT NULL,
    start_time DATETIME GENERATED ALWAYS AS (booking_start_time) VIRTUAL,
    end_time DATETIME GENERATED ALWAYS AS (expected_exit_time) VIRTUAL,
    actual_entry_time DATETIME NULL,
    actual_exit_time DATETIME NULL,
    booking_duration INT NOT NULL,
    duration_hours INT GENERATED ALWAYS AS (booking_duration) VIRTUAL,
    amount DECIMAL(10, 2) NOT NULL,
    overtime_fee DECIMAL(10, 2) DEFAULT 0.00,
    booking_status ENUM('CONFIRMED', 'ACTIVE', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'CONFIRMED',
    status ENUM('CONFIRMED', 'ACTIVE', 'CANCELLED', 'COMPLETED') GENERATED ALWAYS AS (booking_status) VIRTUAL,
    booking_code VARCHAR(30) NOT NULL UNIQUE,
    qr_code_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES parking_slots(id) ON DELETE RESTRICT,
    INDEX idx_booking_user (user_id),
    INDEX idx_booking_slot (slot_id),
    INDEX idx_booking_status (booking_status),
    INDEX idx_booking_code (booking_code),
    INDEX idx_booking_times (booking_start_time, expected_exit_time)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 5. PAYMENTS TABLE
-- Records billing transactions, payment modes (CASH, UPI, CARD), & status.
-- --------------------------------------------------------------------
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('CASH', 'UPI', 'CARD') NOT NULL DEFAULT 'UPI',
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    payment_status ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'SUCCESS',
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_payment_booking (booking_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_transaction_id (transaction_id)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 6. PARKING SESSIONS (QR GATE ENTRY & EXIT TRACKING)
-- Tracks physical gate entry and boom barrier exit with overtime checks.
-- --------------------------------------------------------------------
CREATE TABLE parking_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    slot_id INT NOT NULL,
    location_id INT NOT NULL,
    vehicle_number VARCHAR(30) NOT NULL,
    entry_time DATETIME NOT NULL,
    exit_time DATETIME NULL,
    planned_duration_hours INT NOT NULL,
    actual_duration_minutes INT DEFAULT 0,
    overtime_minutes INT DEFAULT 0,
    base_amount DECIMAL(10, 2) NOT NULL,
    overtime_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount_paid DECIMAL(10, 2) NOT NULL,
    status ENUM('ACTIVE', 'COMPLETED', 'OVERDUE') NOT NULL DEFAULT 'ACTIVE',
    verified_by VARCHAR(100) DEFAULT 'Gate Scanner Terminal A1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES parking_slots(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES parking_locations(id) ON DELETE CASCADE,
    INDEX idx_session_status (status),
    INDEX idx_session_vehicle (vehicle_number)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 7. NOTIFICATIONS & ADMIN ALERTS TABLE
-- Stores driver notifications and administrator system event alerts
-- (new booking, cancellation, payment, slot update, registration, capacity, system error).
-- --------------------------------------------------------------------
CREATE TABLE notifications (
    id VARCHAR(64) PRIMARY KEY,
    notification_id VARCHAR(64) GENERATED ALWAYS AS (id) VIRTUAL,
    admin_id VARCHAR(64) NULL,
    user_id VARCHAR(64) NULL,
    booking_id VARCHAR(64) NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    notification_type VARCHAR(50) GENERATED ALWAYS AS (type) VIRTUAL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    related_entity_id VARCHAR(64) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON NULL,
    UNIQUE KEY uq_booking_notif (booking_id, type),
    INDEX idx_notif_admin (admin_id),
    INDEX idx_notif_user (user_id),
    INDEX idx_notif_booking (booking_id),
    INDEX idx_notif_type (type),
    INDEX idx_notif_read (is_read),
    INDEX idx_notif_created_at (created_at)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 8. VEHICLE NUMBER PLATE RECOGNITION (ANPR / OCR LOGS)
-- Computer vision scan audit trail and OCR verification history.
-- --------------------------------------------------------------------
CREATE TABLE vehicle_ocr_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    plate_number VARCHAR(30) NOT NULL,
    confidence_score DECIMAL(5, 2) NOT NULL DEFAULT 95.00,
    vehicle_type_guess VARCHAR(20) DEFAULT 'CAR',
    state_code VARCHAR(10) DEFAULT 'KA',
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_ocr_plate (plate_number)
) ENGINE=InnoDB;
