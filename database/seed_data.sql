-- ====================================================================
-- SMART PARKING MANAGEMENT SYSTEM - SEED DATA
-- Target Database: smart_parking
-- College Final Year BCA Project
-- ====================================================================

USE smart_parking;

-- ====================================================================
-- DEMO LOGIN CREDENTIALS
-- --------------------------------------------------------------------
-- Administrator:
--   Email:    admin@smartparking.com
--   Password: admin123
--   Role:     ADMIN
--
-- Demo User 1:
--   Email:    rahul.sharma@gmail.com
--   Password: password123
--   Role:     USER
--
-- Demo User 2:
--   Email:    priya.patel@gmail.com
--   Password: password123
--   Role:     USER
--
-- Demo User 3:
--   Email:    likitha.shetty@gmail.com
--   Password: password123
--   Role:     USER
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. USERS SEED DATA (1 Admin + 3 Users)
-- --------------------------------------------------------------------
INSERT INTO users (id, name, email, password, phone, role, created_at) VALUES
(1, 'System Administrator', 'admin@smartparking.com', 'admin123', '+91 98765 43210', 'ADMIN', NOW()),
(2, 'Rahul Sharma', 'rahul.sharma@gmail.com', 'password123', '+91 98450 11223', 'USER', NOW()),
(3, 'Priya Patel', 'priya.patel@gmail.com', 'password123', '+91 97312 44556', 'USER', NOW()),
(4, 'Likitha Shetty', 'likitha.shetty@gmail.com', 'password123', '+91 99001 88776', 'USER', NOW());

-- --------------------------------------------------------------------
-- 2. PARKING LOCATIONS (3 Realistic Indian Facilities)
-- --------------------------------------------------------------------
INSERT INTO parking_locations (id, name, address, city, total_slots, latitude, longitude, created_at) VALUES
(1, 'Tirupati Central Parking', 'Opposite RTC Central Bus Stand, Railway Station Road', 'Tirupati', 12, 13.62880000, 79.41920000, NOW()),
(2, 'Chennai City Parking', 'Express Avenue Commercial Precinct, Anna Salai, Royapettah', 'Chennai', 12, 13.05940000, 80.26120000, NOW()),
(3, 'Bengaluru Tech Park Parking', 'Electronic City Phase 1, Near Infosys Gate 1', 'Bengaluru', 12, 12.84520000, 77.66020000, NOW());

-- --------------------------------------------------------------------
-- 3. PARKING SLOTS (36 Realistic Slots: 12 per location)
-- Slot Types: REGULAR, EV, DISABLED
-- Vehicle Types: BIKE, CAR, SUV
-- Status: AVAILABLE, RESERVED, OCCUPIED, MAINTENANCE
-- --------------------------------------------------------------------

-- Location 1: Tirupati Central Parking (12 slots)
INSERT INTO parking_slots (id, location_id, slot_number, floor, slot_type, vehicle_type, status, hourly_rate) VALUES
(1,  1, 'G-01', 'Ground Floor', 'DISABLED', 'CAR',  'AVAILABLE', 20.00),
(2,  1, 'G-02', 'Ground Floor', 'REGULAR',  'CAR',  'AVAILABLE', 20.00),
(3,  1, 'G-03', 'Ground Floor', 'EV',       'CAR',  'AVAILABLE', 35.00),
(4,  1, 'G-04', 'Ground Floor', 'REGULAR',  'SUV',  'RESERVED',  30.00),
(5,  1, 'G-05', 'Ground Floor', 'REGULAR',  'BIKE', 'AVAILABLE', 10.00),
(6,  1, 'G-06', 'Ground Floor', 'REGULAR',  'BIKE', 'OCCUPIED',  10.00),
(7,  1, 'F1-01', 'Floor 1',     'REGULAR',  'CAR',  'AVAILABLE', 20.00),
(8,  1, 'F1-02', 'Floor 1',     'EV',       'CAR',  'OCCUPIED',  35.00),
(9,  1, 'F1-03', 'Floor 1',     'REGULAR',  'SUV',  'AVAILABLE', 30.00),
(10, 1, 'F1-04', 'Floor 1',     'REGULAR',  'CAR',  'AVAILABLE', 20.00),
(11, 1, 'F2-01', 'Floor 2',     'REGULAR',  'CAR',  'AVAILABLE', 20.00),
(12, 1, 'F2-02', 'Floor 2',     'REGULAR',  'CAR',  'MAINTENANCE', 20.00);

-- Location 2: Chennai City Parking (12 slots)
INSERT INTO parking_slots (id, location_id, slot_number, floor, slot_type, vehicle_type, status, hourly_rate) VALUES
(13, 2, 'G-01', 'Ground Floor', 'DISABLED', 'CAR',  'AVAILABLE', 30.00),
(14, 2, 'G-02', 'Ground Floor', 'EV',       'CAR',  'AVAILABLE', 45.00),
(15, 2, 'G-03', 'Ground Floor', 'REGULAR',  'CAR',  'OCCUPIED',  30.00),
(16, 2, 'G-04', 'Ground Floor', 'REGULAR',  'SUV',  'AVAILABLE', 40.00),
(17, 2, 'G-05', 'Ground Floor', 'REGULAR',  'BIKE', 'AVAILABLE', 15.00),
(18, 2, 'G-06', 'Ground Floor', 'REGULAR',  'BIKE', 'OCCUPIED',  15.00),
(19, 2, 'B1-01', 'Basement 1',  'REGULAR',  'CAR',  'AVAILABLE', 25.00),
(20, 2, 'B1-02', 'Basement 1',  'EV',       'SUV',  'AVAILABLE', 45.00),
(21, 2, 'B1-03', 'Basement 1',  'REGULAR',  'CAR',  'RESERVED',  25.00),
(22, 2, 'B1-04', 'Basement 1',  'REGULAR',  'SUV',  'AVAILABLE', 35.00),
(23, 2, 'B2-01', 'Basement 2',  'REGULAR',  'CAR',  'AVAILABLE', 25.00),
(24, 2, 'B2-02', 'Basement 2',  'REGULAR',  'CAR',  'AVAILABLE', 25.00);

-- Location 3: Bengaluru Tech Park Parking (12 slots)
INSERT INTO parking_slots (id, location_id, slot_number, floor, slot_type, vehicle_type, status, hourly_rate) VALUES
(25, 3, 'G-01', 'Ground Floor', 'DISABLED', 'CAR',  'AVAILABLE', 40.00),
(26, 3, 'G-02', 'Ground Floor', 'EV',       'CAR',  'AVAILABLE', 60.00),
(27, 3, 'G-03', 'Ground Floor', 'EV',       'SUV',  'OCCUPIED',  60.00),
(28, 3, 'G-04', 'Ground Floor', 'REGULAR',  'SUV',  'AVAILABLE', 50.00),
(29, 3, 'G-05', 'Ground Floor', 'REGULAR',  'BIKE', 'AVAILABLE', 20.00),
(30, 3, 'G-06', 'Ground Floor', 'REGULAR',  'BIKE', 'AVAILABLE', 20.00),
(31, 3, 'L1-01', 'Level 1',     'REGULAR',  'CAR',  'AVAILABLE', 40.00),
(32, 3, 'L1-02', 'Level 1',     'REGULAR',  'CAR',  'RESERVED',  40.00),
(33, 3, 'L1-03', 'Level 1',     'REGULAR',  'SUV',  'AVAILABLE', 50.00),
(34, 3, 'L1-04', 'Level 1',     'EV',       'CAR',  'AVAILABLE', 60.00),
(35, 3, 'L2-01', 'Level 2',     'REGULAR',  'CAR',  'AVAILABLE', 35.00),
(36, 3, 'L2-02', 'Level 2',     'REGULAR',  'CAR',  'AVAILABLE', 35.00);

-- --------------------------------------------------------------------
-- 4. SAMPLE BOOKINGS
-- --------------------------------------------------------------------
INSERT INTO bookings (id, user_id, slot_id, vehicle_number, vehicle_type, booking_start_time, expected_exit_time, booking_duration, amount, booking_status, booking_code, created_at) VALUES
(1, 2, 4,  'AP 03 CM 4488', 'SUV', DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_ADD(NOW(), INTERVAL 2 HOUR), 3, 90.00,  'CONFIRMED', 'TPT-2026-8891', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(2, 3, 21, 'TN 07 BE 1234', 'CAR', DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_ADD(NOW(), INTERVAL 1 HOUR), 3, 75.00,  'CONFIRMED', 'CHN-2026-4421', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(3, 4, 32, 'KA 01 MJ 9000', 'CAR', DATE_SUB(NOW(), INTERVAL 30 MINUTE), DATE_ADD(NOW(), INTERVAL 3 HOUR), 4, 160.00, 'CONFIRMED', 'BLR-2026-7732', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(4, 2, 6,  'AP 03 CZ 1010', 'BIKE', DATE_SUB(NOW(), INTERVAL 5 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR), 2, 20.00,  'COMPLETED', 'TPT-2026-1102', DATE_SUB(NOW(), INTERVAL 6 HOUR));

-- --------------------------------------------------------------------
-- 5. SAMPLE PAYMENTS
-- --------------------------------------------------------------------
INSERT INTO payments (id, booking_id, amount, payment_method, transaction_id, payment_status, paid_at) VALUES
(1, 1, 90.00,  'UPI',  'UPI/2026/8947239012', 'SUCCESS', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(2, 2, 75.00,  'CARD', 'TXN_CARD_992147812',  'SUCCESS', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(3, 3, 160.00, 'UPI',  'UPI/2026/1129847119', 'SUCCESS', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(4, 4, 20.00,  'CASH', 'CASH_RECEIPT_00192',  'SUCCESS', DATE_SUB(NOW(), INTERVAL 5 HOUR));
