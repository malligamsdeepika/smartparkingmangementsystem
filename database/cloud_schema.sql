-- ==============================================================================
-- SMART PARKING MANAGEMENT SYSTEM - CLOUD DATABASE INITIALIZATION SCRIPT
-- ==============================================================================
-- Compatible with Cloud Managed MySQL Databases:
-- - Railway MySQL
-- - Aiven for MySQL (Free Tier)
-- - TiDB Cloud (Serverless Free Tier)
-- - Clever Cloud MySQL
-- - AWS RDS MySQL / GCP Cloud SQL
--
-- NOTE: Does NOT execute DROP DATABASE or CREATE DATABASE, so you can run it
-- directly inside your allocated cloud database (e.g. railway, defaultdb, etc.)
-- ==============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
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

-- 2. PARKING LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS parking_locations (
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

-- 3. PARKING SLOTS TABLE
CREATE TABLE IF NOT EXISTS parking_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    slot_number VARCHAR(20) NOT NULL,
    floor VARCHAR(20) NOT NULL DEFAULT 'Ground Floor',
    slot_type ENUM('REGULAR', 'EV', 'DISABLED') NOT NULL DEFAULT 'REGULAR',
    vehicle_type ENUM('BIKE', 'CAR', 'SUV') NOT NULL DEFAULT 'CAR',
    status ENUM('AVAILABLE', 'RESERVED', 'OCCUPIED', 'MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
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

-- 4. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    slot_id INT NOT NULL,
    vehicle_number VARCHAR(30) NOT NULL,
    vehicle_type ENUM('BIKE', 'CAR', 'SUV') NOT NULL DEFAULT 'CAR',
    booking_start_time DATETIME NOT NULL,
    expected_exit_time DATETIME NOT NULL,
    actual_entry_time DATETIME NULL,
    actual_exit_time DATETIME NULL,
    booking_duration INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    overtime_fee DECIMAL(10, 2) DEFAULT 0.00,
    booking_status ENUM('CONFIRMED', 'ACTIVE', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'CONFIRMED',
    booking_code VARCHAR(30) NOT NULL UNIQUE,
    qr_code_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES parking_slots(id) ON DELETE RESTRICT,
    INDEX idx_booking_user (user_id),
    INDEX idx_booking_slot (slot_id),
    INDEX idx_booking_status (booking_status),
    INDEX idx_booking_code (booking_code)
) ENGINE=InnoDB;

-- 5. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
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

-- 6. PARKING SESSIONS (QR GATE ENTRY & EXIT TRACKING)
CREATE TABLE IF NOT EXISTS parking_sessions (
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

-- 7. NOTIFICATIONS & ADMIN ALERTS TABLE
CREATE TABLE IF NOT EXISTS notifications (
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
    UNIQUE KEY uq_cloud_booking_notif (booking_id, type),
    INDEX idx_notif_admin (admin_id),
    INDEX idx_notif_user (user_id),
    INDEX idx_notif_booking (booking_id),
    INDEX idx_notif_type (type),
    INDEX idx_notif_read (is_read),
    INDEX idx_notif_created_at (created_at)
) ENGINE=InnoDB;

-- 8. VEHICLE NUMBER PLATE RECOGNITION (ANPR / OCR LOGS)
CREATE TABLE IF NOT EXISTS vehicle_ocr_logs (
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

-- -----------------------------------------------------------------------------
-- SEED INITIAL DATA (INSERT ONLY IF NOT ALREADY PRESENT)
-- -----------------------------------------------------------------------------

-- Default Users (Password: pass123 hashed or plain demo)
INSERT IGNORE INTO users (id, name, email, password, phone, role) VALUES
(1, 'Rahul Sharma (Driver)', 'rahul@example.com', '$2a$12$e8Y5t1h.u4n2W4H5L0Wl3.O9V7v2k7E9Y2v4U7L8K9H1W2O3R4U5.', '+91 98765 43210', 'USER'),
(2, 'Officer Vikram (Admin)', 'admin@smartparking.com', '$2a$12$e8Y5t1h.u4n2W4H5L0Wl3.O9V7v2k7E9Y2v4U7L8K9H1W2O3R4U5.', '+91 91234 56789', 'ADMIN'),
(3, 'Priya Nair', 'priya@example.com', '$2a$12$e8Y5t1h.u4n2W4H5L0Wl3.O9V7v2k7E9Y2v4U7L8K9H1W2O3R4U5.', '+91 99887 76655', 'USER');

-- 4 Parking Locations
INSERT IGNORE INTO parking_locations (id, name, address, city, total_slots, latitude, longitude, operating_hours, landmark) VALUES
(1, 'Metro City Center Plaza', '104 Brigade Road, Ashok Nagar', 'Bengaluru', 24, 12.9716, 77.5946, '24/7 All Days', 'Near MG Road Metro Station'),
(2, 'Global Tech Park - Bay 3', 'Outer Ring Road, Bellandur', 'Bengaluru', 30, 12.9255, 77.6835, '06:00 AM - 11:30 PM', 'Opposite EcoSpace Tech Park'),
(3, 'Indiranagar Prime Mall', '100ft Road, HAL 2nd Stage, Indiranagar', 'Bengaluru', 20, 12.9784, 77.6408, '08:00 AM - 12:00 AM', 'Near 12th Main Junction'),
(4, 'Central Railway Junction Terminal', 'Station Road, Majestic', 'Bengaluru', 35, 12.9780, 77.5695, '24/7 All Days', 'Platform 1 Main Entrance');

-- Sample Initial Slots for Metro City Center (Location 1)
INSERT IGNORE INTO parking_slots (id, location_id, slot_number, floor, slot_type, vehicle_type, status, hourly_rate, is_shaded) VALUES
(1, 1, 'G-01', 'Ground Floor', 'REGULAR', 'CAR', 'AVAILABLE', 20.00, TRUE),
(2, 1, 'G-02', 'Ground Floor', 'REGULAR', 'CAR', 'OCCUPIED', 20.00, TRUE),
(3, 1, 'G-03', 'Ground Floor', 'REGULAR', 'CAR', 'OCCUPIED', 20.00, TRUE),
(4, 1, 'G-04', 'Ground Floor', 'REGULAR', 'CAR', 'AVAILABLE', 20.00, TRUE),
(5, 1, 'G-05', 'Ground Floor', 'EV', 'CAR', 'AVAILABLE', 25.00, TRUE),
(6, 1, 'G-06', 'Ground Floor', 'EV', 'CAR', 'OCCUPIED', 25.00, TRUE),
(7, 1, 'G-07', 'Ground Floor', 'DISABLED', 'CAR', 'AVAILABLE', 20.00, TRUE),
(8, 1, 'G-08', 'Ground Floor', 'REGULAR', 'BIKE', 'AVAILABLE', 10.00, TRUE),
(9, 1, 'G-09', 'Ground Floor', 'REGULAR', 'BIKE', 'OCCUPIED', 10.00, TRUE),
(10, 1, 'G-10', 'Ground Floor', 'REGULAR', 'BIKE', 'AVAILABLE', 10.00, TRUE),
(11, 1, 'F1-01', 'Floor 1', 'REGULAR', 'CAR', 'AVAILABLE', 20.00, TRUE),
(12, 1, 'F1-02', 'Floor 1', 'REGULAR', 'CAR', 'AVAILABLE', 20.00, TRUE),
(13, 1, 'F1-03', 'Floor 1', 'REGULAR', 'CAR', 'OCCUPIED', 20.00, TRUE),
(14, 1, 'F1-04', 'Floor 1', 'REGULAR', 'CAR', 'AVAILABLE', 20.00, TRUE),
(15, 1, 'F1-05', 'Floor 1', 'EV', 'CAR', 'AVAILABLE', 25.00, TRUE),
(16, 1, 'F1-06', 'Floor 1', 'DISABLED', 'CAR', 'AVAILABLE', 20.00, TRUE),
(17, 1, 'F1-07', 'Floor 1', 'REGULAR', 'BIKE', 'AVAILABLE', 10.00, TRUE),
(18, 1, 'F1-08', 'Floor 1', 'REGULAR', 'BIKE', 'OCCUPIED', 10.00, TRUE);

-- Update Total Slots count on locations
UPDATE parking_locations SET total_slots = (SELECT COUNT(*) FROM parking_slots WHERE location_id = 1) WHERE id = 1;
