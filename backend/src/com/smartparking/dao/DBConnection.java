package com.smartparking.dao;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * ============================================================================
 * SMART PARKING MANAGEMENT SYSTEM - DATABASE CONNECTION UTILITY
 * ============================================================================
 * Manages JDBC connection lifecycle to MySQL 8.0+ database.
 * 
 * WHERE TO CONFIGURE DATABASE CREDENTIALS:
 * If your local MySQL uses different credentials, update these three constants:
 * 1. DB_URL:      Change "localhost:3306/smart_parking" to your host/database
 * 2. DB_USER:     Change "root" to your MySQL username
 * 3. DB_PASSWORD: Change "root" to your MySQL password
 * 
 * Alternatively, you can set system environment variables:
 * - SMART_PARKING_DB_URL
 * - SMART_PARKING_DB_USER
 * - SMART_PARKING_DB_PASS
 * ============================================================================
 */
public class DBConnection {

    // ========================================================================
    // DATABASE CONFIGURATION CONSTANTS (UPDATE HERE FOR YOUR SYSTEM)
    // ========================================================================
    private static final String DEFAULT_URL = "jdbc:mysql://localhost:3306/smart_parking?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Kolkata&characterEncoding=UTF-8";
    private static final String DEFAULT_USER = "root";
    private static final String DEFAULT_PASSWORD = "root";

    private static final String DRIVER_CLASS = "com.mysql.cj.jdbc.Driver";

    static {
        try {
            // Load MySQL JDBC Driver class
            Class.forName(DRIVER_CLASS);
            System.out.println("[DBConnection] MySQL JDBC Driver loaded successfully: " + DRIVER_CLASS);
        } catch (ClassNotFoundException e) {
            System.err.println("[DBConnection ERROR] MySQL JDBC Driver not found in classpath! Ensure mysql-connector-j jar is present.");
            e.printStackTrace();
        }
    }

    /**
     * Obtains a new active Connection to the MySQL database.
     * 
     * @return Connection object ready for PreparedStatements
     * @throws SQLException if a database access error occurs
     */
    public static Connection getConnection() throws SQLException {
        // Read environment overrides if present, otherwise use defaults
        String envUrl = System.getenv("SMART_PARKING_DB_URL");
        String envUser = System.getenv("SMART_PARKING_DB_USER");
        String envPass = System.getenv("SMART_PARKING_DB_PASS");

        String url = (envUrl != null && !envUrl.trim().isEmpty()) ? envUrl : DEFAULT_URL;
        String user = (envUser != null && !envUser.trim().isEmpty()) ? envUser : DEFAULT_USER;
        String password = (envPass != null) ? envPass : DEFAULT_PASSWORD;

        try {
            return DriverManager.getConnection(url, user, password);
        } catch (SQLException e) {
            System.err.println("[DBConnection ERROR] Failed to connect to MySQL database at: " + url);
            System.err.println("Verify that MySQL Server is running on port 3306 and database 'smart_parking' exists.");
            throw e;
        }
    }

    /**
     * Safely closes the database resources (ResultSet, Statement, Connection).
     */
    public static void closeResources(ResultSet rs, Statement stmt, Connection conn) {
        if (rs != null) {
            try {
                rs.close();
            } catch (SQLException e) {
                System.err.println("[DBConnection] Error closing ResultSet: " + e.getMessage());
            }
        }
        if (stmt != null) {
            try {
                stmt.close();
            } catch (SQLException e) {
                System.err.println("[DBConnection] Error closing Statement: " + e.getMessage());
            }
        }
        if (conn != null) {
            try {
                conn.close();
            } catch (SQLException e) {
                System.err.println("[DBConnection] Error closing Connection: " + e.getMessage());
            }
        }
    }

    /**
     * Convenience method to close Statement and Connection.
     */
    public static void closeResources(Statement stmt, Connection conn) {
        closeResources(null, stmt, conn);
    }
}
