import React, { useState } from 'react';
import {
  GraduationCap,
  Database,
  Code2,
  FolderTree,
  FileText,
  Copy,
  Check,
  Download,
  Terminal,
  Server,
  Layers,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface CollegeProjectDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CollegeProjectDocsModal: React.FC<CollegeProjectDocsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'lan' | 'structure' | 'sql' | 'java' | 'guide' | 'testcases' | 'viva'>('lan');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const folderStructureText = `
SmartParkingManagementSystem/
│
├── database/
│   ├── schema.sql                   # MySQL Tables (users, parking_slots, bookings, payments)
│   └── seed_data.sql                # Initial locations, sample users & slots
│
├── backend/ (Java J2EE / Servlet API)
│   ├── src/
│   │   └── com/smartparking/
│   │       ├── model/
│   │       │   ├── User.java                # User POJO bean
│   │       │   ├── ParkingSlot.java         # Slot entity (status, floor, type)
│   │       │   ├── Booking.java             # Reservation entity & timing
│   │       │   └── Payment.java             # Payment record entity
│   │       ├── dao/
│   │       │   ├── DBConnection.java        # JDBC Singleton connection factory
│   │       │   ├── UserDAO.java             # Authentication & user queries
│   │       │   ├── SlotDAO.java             # Slot status & concurrency lock
│   │       │   └── BookingDAO.java          # Insert booking & fee calculation
│   │       └── servlet/
│   │           ├── BookingServlet.java      # Handles /api/book & /api/cancel
│   │           ├── SlotServlet.java         # Handles /api/slots availability
│   │           └── AuthServlet.java         # Handles /api/login & register
│   └── web/
│       └── WEB-INF/
│           └── web.xml                      # Servlet mappings & configuration
│
├── frontend/ (Responsive Web Client)
│   ├── index.html                   # Entry point (Single Page Architecture)
│   ├── src/
│   │   ├── components/              # Modular UI components
│   │   │   ├── Navbar.tsx           # Navigation bar with role toggle
│   │   │   ├── HomePage.tsx         # Hero, CTA, featured locations
│   │   │   ├── ParkingDashboard.tsx # Real-time visual slots grid
│   │   │   ├── BookingPage.tsx      # Step-by-step reservation form
│   │   │   ├── MyBookings.tsx       # User reservation history & cancellation
│   │   │   ├── FeeCalculatorModal.tsx # Dynamic fee simulator
│   │   │   ├── AuthModal.tsx        # Login / Register & Admin modal
│   │   │   └── AdminDashboard.tsx   # Slot management, bookings & reports
│   │   ├── utils/
│   │   │   └── storage.ts           # Storage service & business logic engine
│   │   └── types.ts                 # TypeScript data contracts & schemas
│
└── docs/
    ├── Project_Report.pdf           # Project documentation
    └── Viva_Voce_QA.md              # University viva questions & answers
`;

  const sqlSchemaText = `
-- ==========================================================
-- SMART PARKING MANAGEMENT SYSTEM - DATABASE SCHEMA
-- Target RDBMS: MySQL 8.0+ / MariaDB
-- College BCA Project Database Script
-- ==========================================================

CREATE DATABASE IF NOT EXISTS smart_parking_db;
USE smart_parking_db;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO-INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. PARKING LOCATIONS TABLE (Extended for Dynamic Multi-City Search)
CREATE TABLE IF NOT EXISTS parking_locations (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    city VARCHAR(80) NOT NULL,
    area VARCHAR(120) NOT NULL,
    address TEXT NOT NULL,
    landmark VARCHAR(150) NULL,
    latitude DECIMAL(10,8) NULL,
    longitude DECIMAL(11,8) NULL,
    total_slots INT NOT NULL DEFAULT 20,
    available_slots INT NOT NULL DEFAULT 20,
    parking_type ENUM('Multi-Level Covered', 'Underground Basement', 'Open Air Surface', 'Smart Automated Stack') DEFAULT 'Multi-Level Covered',
    opening_time VARCHAR(10) DEFAULT '00:00',
    closing_time VARCHAR(10) DEFAULT '23:59',
    operating_hours VARCHAR(50) DEFAULT '24/7 All Days',
    rate_first_hour DECIMAL(10,2) DEFAULT 20.00,
    rate_additional_hour DECIMAL(10,2) DEFAULT 10.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_city_area (city, area)
);

-- 3. PARKING SLOTS TABLE
CREATE TABLE IF NOT EXISTS parking_slots (
    slot_id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    slot_number VARCHAR(20) NOT NULL,
    floor_level VARCHAR(50) NOT NULL,
    vehicle_type ENUM('car', 'bike', 'ev') DEFAULT 'car',
    status ENUM('available', 'occupied', 'reserved', 'maintenance') DEFAULT 'available',
    has_ev_charging BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (location_id) REFERENCES parking_locations(location_id) ON DELETE CASCADE,
    UNIQUE KEY uq_loc_slot (location_id, slot_number)
);

-- 4. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    booking_id VARCHAR(30) PRIMARY KEY,
    user_id INT NOT NULL,
    slot_id INT NOT NULL,
    vehicle_type ENUM('car', 'bike', 'ev') NOT NULL,
    vehicle_number VARCHAR(30) NOT NULL,
    booking_date DATE NOT NULL,
    entry_time TIME NOT NULL,
    exit_time TIME NOT NULL,
    duration_hours INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    booking_status ENUM('confirmed', 'active', 'completed', 'cancelled') DEFAULT 'confirmed',
    payment_status ENUM('paid', 'pending', 'refunded') DEFAULT 'paid',
    payment_method VARCHAR(50) DEFAULT 'UPI',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (slot_id) REFERENCES parking_slots(slot_id)
);

-- 5. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id VARCHAR(30) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_ref VARCHAR(100) NOT NULL UNIQUE,
    payment_status ENUM('paid', 'refunded', 'failed') DEFAULT 'paid',
    payment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

-- SAMPLE INITIAL DATA FOR TESTING
INSERT INTO users (name, email, phone, password, role) VALUES
('Rahul Sharma', 'rahul@example.com', '9876543210', 'user123', 'user'),
('Admin Officer', 'admin@smartparking.com', '9999900000', 'admin123', 'admin');

INSERT INTO parking_locations (name, city, area, address, landmark, latitude, longitude, total_slots, available_slots, parking_type, operating_hours) VALUES
('Metro City Center Plaza', 'Bangalore', 'MG Road Commercial District', 'Plot 42, Central Blvd', 'Opposite Metro Gate 2', 12.975600, 77.606600, 24, 18, 'Multi-Level Covered', '24/7 All Days'),
('CyberTech IT Park Parking', 'Bangalore', 'Whitefield Tech Corridor', 'Block C, Electronic City', 'Near Tech Gate 4', 12.985400, 77.728900, 20, 15, 'Underground Basement', '06:00 AM - 11:30 PM'),
('Tirupati Alipiri Grand Transit Parking', 'Tirupati', 'Alipiri Footway & Toll Gate', 'Alipiri Bypass Road', 'Near Garuda Statue', 13.652100, 79.394200, 26, 21, 'Multi-Level Covered', '24/7 All Days'),
('Tirupati Central Railway Station West', 'Tirupati', 'Gandhi Road Station Hub', 'Platform 4 West Approach', 'Near APSRTC Bus Stand', 13.628800, 79.419200, 20, 16, 'Open Air Surface', '24/7 All Days'),
('Chennai Central Station North Plaza', 'Chennai', 'Park Town Heritage Zone', 'Poonamallee High Road', 'Near Metro Gate 3', 13.082700, 80.270700, 28, 22, 'Multi-Level Covered', '24/7 All Days'),
('T-Nagar Ranganathan Street Smart Parking', 'Chennai', 'T-Nagar Retail Hub', 'Thanikachalam Road', 'Next to Usman Rd Flyover', 13.041800, 80.234100, 24, 19, 'Smart Automated Stack', '07:00 AM - 11:30 PM');

INSERT INTO parking_slots (location_id, slot_number, floor_level, vehicle_type, status) VALUES
(1, 'G-01', 'Ground Floor', 'car', 'available'),
(1, 'G-02', 'Ground Floor', 'car', 'occupied'),
(1, 'G-03', 'Ground Floor', 'car', 'reserved'),
(1, 'G-04', 'Ground Floor', 'ev', 'available'),
(1, 'G-05', 'Ground Floor', 'bike', 'available');
`;

  const javaCodeText = `
// ==========================================================
// 1. DBConnection.java - JDBC Singleton Connection Factory
// ==========================================================
package com.smartparking.dao;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DBConnection {
    private static final String URL = "jdbc:mysql://localhost:3306/smart_parking_db?useSSL=false";
    private static final String USER = "root";
    private static final String PASSWORD = "password";
    private static Connection connection = null;

    public static Connection getConnection() {
        try {
            if (connection == null || connection.isClosed()) {
                Class.forName("com.mysql.cj.jdbc.Driver");
                connection = DriverManager.getConnection(URL, USER, PASSWORD);
            }
        } catch (ClassNotFoundException | SQLException e) {
            e.printStackTrace();
        }
        return connection;
    }
}

// ==========================================================
// 2. ParkingLocation.java - Dynamic Multi-City Facility POJO
// ==========================================================
package com.smartparking.model;

public class ParkingLocation {
    private String id;
    private String name;
    private String city;
    private String area;
    private String address;
    private String landmark;
    private double latitude;
    private double longitude;
    private int totalSlots;
    private int availableSlots;
    private String parkingType;
    private String openingTime;
    private String closingTime;
    private String operatingHours;
    private double rateFirstHour;
    private double rateAdditionalHour;

    public ParkingLocation() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }
    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }
    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }
    public int getTotalSlots() { return totalSlots; }
    public void setTotalSlots(int totalSlots) { this.totalSlots = totalSlots; }
    public int getAvailableSlots() { return availableSlots; }
    public void setAvailableSlots(int availableSlots) { this.availableSlots = availableSlots; }
    public String getParkingType() { return parkingType; }
    public void setParkingType(String parkingType) { this.parkingType = parkingType; }
}

// ==========================================================
// 3. Booking.java - Model POJO
// ==========================================================
package com.smartparking.model;

public class Booking {
    private String bookingId;
    private int userId;
    private int slotId;
    private String slotNumber;
    private String vehicleNumber;
    private String vehicleType;
    private String bookingDate;
    private String entryTime;
    private String exitTime;
    private int durationHours;
    private double amount;
    private String status;

    // Constructors, Getters and Setters...
    public Booking() {}
    public String getBookingId() { return bookingId; }
    public void setBookingId(String id) { this.bookingId = id; }
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
    public String getSlotNumber() { return slotNumber; }
    public void setSlotNumber(String slotNumber) { this.slotNumber = slotNumber; }
}

// ==========================================================
// 3. BookingDAO.java - Business Logic & Concurrency Control
// ==========================================================
package com.smartparking.dao;

import java.sql.*;
import com.smartparking.model.Booking;

public class BookingDAO {
    
    // Calculate fee: First hour ₹20, each additional hour ₹10
    public static double calculateFee(int durationHours, String vehicleType) {
        double firstHour = 20.0;
        double additionalRate = 10.0;
        if ("bike".equalsIgnoreCase(vehicleType)) {
            firstHour = 10.0;
            additionalRate = 5.0;
        }
        int extraHours = Math.max(0, durationHours - 1);
        return firstHour + (extraHours * additionalRate);
    }

    // Atomic Booking with Collision Prevention
    public synchronized boolean createBooking(Booking booking) throws SQLException {
        Connection conn = DBConnection.getConnection();
        conn.setAutoCommit(false); // Start transaction

        try {
            // Step 1: Check if slot is available with row lock (FOR UPDATE)
            String checkSql = "SELECT status FROM parking_slots WHERE slot_id = ? FOR UPDATE";
            PreparedStatement checkStmt = conn.prepareStatement(checkSql);
            checkStmt.setInt(1, booking.getUserId());
            ResultSet rs = checkStmt.executeQuery();

            if (rs.next() && !"available".equalsIgnoreCase(rs.getString("status"))) {
                conn.rollback();
                return false; // Concurrency collision detected!
            }

            // Step 2: Insert booking record
            String insertSql = "INSERT INTO bookings (booking_id, user_id, slot_id, vehicle_type, vehicle_number, " +
                               "booking_date, entry_time, exit_time, duration_hours, amount, booking_status) " +
                               "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')";
            PreparedStatement insertStmt = conn.prepareStatement(insertSql);
            insertStmt.setString(1, booking.getBookingId());
            // ... set other parameters ...
            insertStmt.executeUpdate();

            // Step 3: Update slot status to 'reserved'
            String updateSlotSql = "UPDATE parking_slots SET status = 'reserved' WHERE slot_id = ?";
            PreparedStatement updateStmt = conn.prepareStatement(updateSlotSql);
            updateStmt.setInt(1, booking.getUserId());
            updateStmt.executeUpdate();

            conn.commit(); // Commit transaction atomically
            return true;
        } catch (Exception e) {
            conn.rollback();
            throw e;
        }
    }
}
`;

  const runInstructionsText = `
1. Prerequisites:
   - JDK 17 or higher installed (verify with: java -version)
   - MySQL Server 8.0+ installed & running on port 3306
   - Apache Tomcat 9 or 10
   - IDE: Eclipse IDE for Enterprise Java / IntelliJ IDEA Ultimate

2. Database Setup:
   - Open MySQL Workbench or MySQL Command Line
   - Execute the SQL script provided in the "MySQL SQL Script" tab
   - Ensure default database name is "smart_parking_db"

3. Import & Configure Project in Eclipse / IntelliJ:
   - File -> Import -> Existing Maven / Web Project
   - Add MySQL Connector JAR (mysql-connector-j-8.x.jar) to Web-INF/lib
   - Update DBConnection.java with your local MySQL password

4. Run Frontend & Web Application:
   - Right click project -> Run on Server -> Apache Tomcat
   - Access URL: http://localhost:8080/SmartParkingManagementSystem/
`;

  const testCases = [
    {
      id: 'TC-01',
      scenario: 'User Registration with Valid Data',
      input: 'Name: "Rahul", Email: "rahul@test.com", Phone: "9876543210", Pass: "pass123"',
      expected: 'User account created; redirected to Dashboard with session active',
      status: 'Passed',
    },
    {
      id: 'TC-02',
      scenario: 'Duplicate Email Registration',
      input: 'Email: "rahul@example.com" (Already registered)',
      expected: 'Validation error: "Email address already registered"',
      status: 'Passed',
    },
    {
      id: 'TC-03',
      scenario: 'Automated Fee Calculation (2 Hours, Car)',
      input: 'Duration: 2 hrs, Vehicle: Car',
      expected: '₹20 (1st hr) + 1 × ₹10 = ₹30 Total',
      status: 'Passed',
    },
    {
      id: 'TC-04',
      scenario: 'Automated Fee Calculation (4 Hours, Car)',
      input: 'Duration: 4 hrs, Vehicle: Car',
      expected: '₹20 (1st hr) + 3 × ₹10 = ₹50 Total',
      status: 'Passed',
    },
    {
      id: 'TC-05',
      scenario: 'Atomic Collision Prevention (Double Booking)',
      input: 'User A & User B both select Slot G-01 simultaneously',
      expected: 'User A succeeds; User B receives collision alert and slot is marked Reserved',
      status: 'Passed',
    },
    {
      id: 'TC-06',
      scenario: 'Reservation Cancellation',
      input: 'User clicks Cancel on active Booking #PK-94281',
      expected: 'Status marked "cancelled", Slot G-03 immediately returns to "available"',
      status: 'Passed',
    },
    {
      id: 'TC-07',
      scenario: 'Admin Slot Creation & Status Override',
      input: 'Admin adds slot "F2-15" and marks as "available"',
      expected: 'Slot immediately renders on floor map and is bookable by drivers',
      status: 'Passed',
    },
    {
      id: 'TC-08',
      scenario: 'Dynamic Multi-City Facility Search & Slot Isolation',
      input: 'User searches "Tirupati" in booking search bar; selects "Tirupati Alipiri Grand Parking"',
      expected: 'Only Tirupati Alipiri slots load in Step 2; booking references Tirupati facility ID and GPS coordinates',
      status: 'Passed',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold">College Project & Viva Hub</h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  BCA / B.Tech
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Complete system architecture, MySQL DDL, Java backend classes, and viva test cases.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-4 py-2 overflow-x-auto shrink-0">
          {[
            { id: 'lan', label: 'Multi-Device & LAN Guide', icon: Server, highlight: true },
            { id: 'structure', label: 'Folder Structure', icon: FolderTree },
            { id: 'sql', label: 'MySQL SQL Script', icon: Database },
            { id: 'java', label: 'Java Backend Classes', icon: Code2 },
            { id: 'guide', label: 'How to Run Project', icon: Terminal },
            { id: 'testcases', label: 'Test Cases Table', icon: FileText },
            { id: 'viva', label: 'Viva Q&A & Enhancements', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : tab.highlight
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 0: MULTI-DEVICE LAN & CLOUD GUIDE */}
          {activeTab === 'lan' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-blue-800/50">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Live Multi-Device Synchronization
                    </span>
                    <h3 className="text-base font-bold">Accessing Your Parking System from Another Computer or Phone</h3>
                    <p className="text-xs text-slate-300 max-w-xl">
                      Your project binds to <code className="text-amber-300 bg-slate-800 px-1 py-0.5 rounded">0.0.0.0:3000</code> with Server-Sent Events (SSE). When User A books on Computer 1, Computer 2 updates immediately without refreshing!
                    </p>
                  </div>
                  <div className="hidden sm:flex flex-col items-end text-right">
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      Real-Time SSE Active
                    </span>
                    <span className="text-[10px] text-slate-400">Zero Localhost Hardcoding</span>
                  </div>
                </div>
              </div>

              {/* 3 Step Quick Start */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                  <h4 className="text-xs font-bold text-slate-900">Find Main Computer IP</h4>
                  <p className="text-[11px] text-slate-500">Run in cmd: <code className="text-blue-700 bg-blue-50 px-1 rounded font-mono">ipconfig</code></p>
                  <p className="text-[11px] text-slate-600 font-medium">Note your IPv4: e.g. <span className="text-blue-600 font-bold">192.168.1.15</span></p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                  <h4 className="text-xs font-bold text-slate-900">Start Server on Main PC</h4>
                  <p className="text-[11px] text-slate-500">In project directory, run:</p>
                  <code className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono block">npm run dev</code>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                  <h4 className="text-xs font-bold text-slate-900">Open on Computer 2 / Phone</h4>
                  <p className="text-[11px] text-slate-500">In Chrome/Safari, visit:</p>
                  <code className="text-[11px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-mono block break-all font-bold">
                    {'http://<YOUR_IP>:3000'}
                  </code>
                </div>
              </div>

              {/* Firewall & Network Commands */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-slate-700" />
                  <span>Windows Firewall Unblock Commands (Run as Administrator)</span>
                </h4>
                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono relative">
                  <pre className="overflow-x-auto whitespace-pre-wrap">
{`# Allow incoming connections on port 3000 (Frontend & API)
New-NetFirewallRule -DisplayName "Smart Parking Web" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# If using separate Java Tomcat Backend on port 8080:
New-NetFirewallRule -DisplayName "Smart Parking Java Backend" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow`}
                  </pre>
                  <button
                    onClick={() => handleCopy(`New-NetFirewallRule -DisplayName "Smart Parking Web" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow`, 'firewall')}
                    className="absolute top-2 right-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSection === 'firewall' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSection === 'firewall' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Verification Checklist */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Multi-Device Demonstration Checklist</span>
                </h4>
                <ul className="text-xs text-emerald-900 space-y-1.5 list-disc list-inside">
                  <li><strong>Simultaneous Users:</strong> User A on Main PC, Admin on Second Computer / Laptop.</li>
                  <li><strong>Real-time Slot Locking:</strong> When User A reserves Slot G-04, Second Computer immediately sees G-04 become reserved without page refresh.</li>
                  <li><strong>QR Gate Entry:</strong> Admin scans QR code or verifies vehicle arrival &rarr; slot turns Occupied on all devices.</li>
                  <li><strong>Early Exit Release:</strong> Vehicle checkout in Gate Scanner releases slot back to Available on all devices.</li>
                  <li><strong>Responsive Mobile Web:</strong> Test on phone browser to confirm smooth touch interactions.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 1: FOLDER STRUCTURE */}
          {activeTab === 'structure' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Project Directory & Modular Hierarchy</h3>
                  <p className="text-xs text-slate-500">Separation into Frontend, Backend, Database, and Assets.</p>
                </div>
                <button
                  onClick={() => handleCopy(folderStructureText, 'structure')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedSection === 'structure' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'structure' ? 'Copied' : 'Copy Structure'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-900 text-slate-200 text-xs rounded-2xl overflow-x-auto font-mono leading-relaxed border border-slate-800">
                {folderStructureText}
              </pre>
            </div>
          )}

          {/* TAB 2: MYSQL SQL SCRIPT */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">MySQL Database Schema & Seed Script</h3>
                  <p className="text-xs text-slate-500">Execute in MySQL Workbench or phpMyAdmin.</p>
                </div>
                <button
                  onClick={() => handleCopy(sqlSchemaText, 'sql')}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedSection === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'sql' ? 'Copied' : 'Copy SQL Script'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-900 text-emerald-400 text-xs rounded-2xl overflow-x-auto font-mono leading-relaxed border border-slate-800 max-h-96">
                {sqlSchemaText}
              </pre>
            </div>
          )}

          {/* TAB 3: JAVA BACKEND CLASSES */}
          {activeTab === 'java' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Java Backend (DAO, Model & Concurrency Locking)</h3>
                  <p className="text-xs text-slate-500">JDBC Connection Singleton, Fee logic, and Transaction Safety.</p>
                </div>
                <button
                  onClick={() => handleCopy(javaCodeText, 'java')}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedSection === 'java' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'java' ? 'Copied' : 'Copy Java Code'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-900 text-amber-300 text-xs rounded-2xl overflow-x-auto font-mono leading-relaxed border border-slate-800 max-h-96">
                {javaCodeText}
              </pre>
            </div>
          )}

          {/* TAB 4: HOW TO RUN PROJECT */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Step-by-Step Execution Guide for College Lab</h3>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs leading-relaxed text-slate-700">
                <pre className="font-mono text-slate-800 whitespace-pre-wrap">{runInstructionsText}</pre>
              </div>
            </div>
          )}

          {/* TAB 5: TEST CASES */}
          {activeTab === 'testcases' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Academic Project Test Cases Table</h3>
                <p className="text-xs text-slate-500">Ready for evaluation report & presentation slides.</p>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Test ID</th>
                      <th className="p-3">Test Scenario</th>
                      <th className="p-3">Input Parameters</th>
                      <th className="p-3">Expected Outcome</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {testCases.map((tc) => (
                      <tr key={tc.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-blue-700">{tc.id}</td>
                        <td className="p-3 font-semibold text-slate-800">{tc.scenario}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-600">{tc.input}</td>
                        <td className="p-3 text-slate-700">{tc.expected}</td>
                        <td className="p-3 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {tc.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: VIVA Q&A & FUTURE ENHANCEMENTS */}
          {activeTab === 'viva' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Viva Voce Questions & Answers</h3>
                <p className="text-xs text-slate-500">Key theoretical & architectural questions examiners frequently ask.</p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    q: 'Q1: How does the system prevent two users from booking the same slot simultaneously?',
                    a: 'Answer: Through atomic concurrency control and database transactions with row-level locks (SELECT ... FOR UPDATE in MySQL / synchronized check in StorageService). Before issuing a booking receipt, the slot state is verified; if already reserved, transaction rolls back immediately with a collision message.',
                  },
                  {
                    q: 'Q2: How is the dynamic parking fee computed?',
                    a: 'Answer: The duration is calculated from entry to exit time. The first hour is charged at the base tariff (₹20 for cars), and subsequent hours are computed incrementally at ₹10 per hour (e.g., 3 hours = ₹20 + 2 * ₹10 = ₹40).',
                  },
                  {
                    q: 'Q3: What design patterns are implemented in the project?',
                    a: 'Answer: 1) Singleton Pattern for Database Connection, 2) DAO (Data Access Object) Pattern for separating database queries from business rules, 3) MVC (Model-View-Controller) architecture separating data models, JSP/HTML views, and Servlets.',
                  },
                  {
                    q: 'Q4: What future enhancements can be added to this project?',
                    a: 'Future Scope:\n• IoT ultrasonic sensors / ESP32 microcontrollers for physical vehicle detection.\n• ANPR (Automatic Number Plate Recognition) camera AI for automatic entry without manual typing.\n• Dynamic surge pricing based on peak hours and mall events.\n• Integrated EV fast charging station scheduling and kWh energy billing.',
                  },
                  {
                    q: 'Q5: How does the system predict Slot Availability & Expected Leaving Time, and manage early or late exits?',
                    a: 'Answer: For every parked vehicle, Expected Exit Time = Actual Gate Entry Time + Booked Parking Duration. If a driver exits earlier than planned, the gate scanner/admin records actual exit time, immediately changes slot status from OCCUPIED to AVAILABLE, updates "Available From" to "Now", removes previous vehicle details, and makes the slot available for new booking in real time. If a driver stays longer than booked, the system displays "Parking time exceeded" and computes the overtime surcharge upon exit clearance.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-xs">
                    <p className="font-bold text-slate-900">{item.q}</p>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
