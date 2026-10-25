package com.smartparking.dao;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import java.net.URI;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * ============================================================================
 * SMART PARKING MANAGEMENT SYSTEM - CLOUD DATABASE CONNECTION UTILITY
 * ============================================================================
 * Manages JDBC connection pooling with HikariCP to remote or local MySQL 8.0+.
 * Supports cloud hosting platforms (Railway, Render, Aiven, TiDB, Heroku, AWS RDS)
 * automatically via:
 * 1. DATABASE_URL / MYSQL_URL (e.g. mysql://user:pass@host:port/dbname)
 * 2. Individual cloud variables (MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE)
 * 3. Standard JDBC variables (SMART_PARKING_DB_URL, SMART_PARKING_DB_USER, SMART_PARKING_DB_PASS)
 * 4. Fallback default for local development
 * ============================================================================
 */
public class DBConnection {

    private static final String DEFAULT_URL = "jdbc:mysql://localhost:3306/smart_parking?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Kolkata&characterEncoding=UTF-8";
    private static final String DEFAULT_USER = "root";
    private static final String DEFAULT_PASSWORD = "root";

    private static final String DRIVER_CLASS = "com.mysql.cj.jdbc.Driver";
    private static HikariDataSource dataSource = null;
    private static boolean hikariFailed = false;

    static {
        try {
            Class.forName(DRIVER_CLASS);
            System.out.println("[DBConnection] MySQL JDBC Driver loaded: " + DRIVER_CLASS);
            initializeHikariPool();
        } catch (ClassNotFoundException e) {
            System.err.println("[DBConnection ERROR] MySQL JDBC Driver not found in classpath!");
            e.printStackTrace();
        } catch (Throwable t) {
            System.err.println("[DBConnection WARN] HikariCP pool init deferred: " + t.getMessage());
        }
    }

    /**
     * Resolves the database configuration dynamically from environment variables
     */
    public static class DbConfig {
        public String jdbcUrl;
        public String username;
        public String password;

        public DbConfig(String jdbcUrl, String username, String password) {
            this.jdbcUrl = jdbcUrl;
            this.username = username;
            this.password = password;
        }
    }

    public static DbConfig resolveConfig() {
        // 1. Check for standard cloud single-URL formats: DATABASE_URL, MYSQL_URL, JAWSDB_URL, CLEARDB_DATABASE_URL
        String rawUrl = getFirstEnv("DATABASE_URL", "MYSQL_URL", "JAWSDB_URL", "CLEARDB_DATABASE_URL");
        if (rawUrl != null && !rawUrl.trim().isEmpty()) {
            rawUrl = rawUrl.trim();
            if (rawUrl.startsWith("mysql://")) {
                try {
                    URI uri = new URI(rawUrl);
                    String userInfo = uri.getUserInfo();
                    String user = DEFAULT_USER;
                    String pass = DEFAULT_PASSWORD;
                    if (userInfo != null && userInfo.contains(":")) {
                        String[] parts = userInfo.split(":", 2);
                        user = parts[0];
                        pass = parts[1];
                    } else if (userInfo != null) {
                        user = userInfo;
                    }

                    int port = uri.getPort() > 0 ? uri.getPort() : 3306;
                    String path = uri.getPath() != null && uri.getPath().length() > 1 ? uri.getPath().substring(1) : "smart_parking";
                    String query = uri.getQuery();

                    String jdbcUrl = "jdbc:mysql://" + uri.getHost() + ":" + port + "/" + path
                            + "?useSSL=true&requireSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8&autoReconnect=true";
                    if (query != null && !query.isEmpty()) {
                        jdbcUrl += "&" + query;
                    }
                    return new DbConfig(jdbcUrl, user, pass);
                } catch (Exception e) {
                    System.err.println("[DBConnection] Error parsing mysql:// URL: " + e.getMessage());
                }
            } else if (rawUrl.startsWith("jdbc:mysql://")) {
                String envUser = getFirstEnv("MYSQLUSER", "DB_USER", "SMART_PARKING_DB_USER");
                String envPass = getFirstEnv("MYSQLPASSWORD", "DB_PASSWORD", "SMART_PARKING_DB_PASS");
                return new DbConfig(rawUrl, envUser != null ? envUser : DEFAULT_USER, envPass != null ? envPass : DEFAULT_PASSWORD);
            }
        }

        // 2. Check for individual host/port/user/pass variables (Railway, Render, Docker)
        String host = getFirstEnv("MYSQLHOST", "DB_HOST", "MYSQL_HOST");
        if (host != null && !host.trim().isEmpty()) {
            String port = getFirstEnv("MYSQLPORT", "DB_PORT", "MYSQL_PORT");
            String user = getFirstEnv("MYSQLUSER", "DB_USER", "MYSQL_USER", "SMART_PARKING_DB_USER");
            String pass = getFirstEnv("MYSQLPASSWORD", "DB_PASSWORD", "MYSQL_PASSWORD", "SMART_PARKING_DB_PASS");
            String db = getFirstEnv("MYSQLDATABASE", "DB_NAME", "MYSQL_DATABASE", "SMART_PARKING_DB_NAME");

            int p = (port != null && !port.isEmpty()) ? Integer.parseInt(port) : 3306;
            String d = (db != null && !db.isEmpty()) ? db : "smart_parking";
            String u = (user != null) ? user : DEFAULT_USER;
            String pwd = (pass != null) ? pass : DEFAULT_PASSWORD;

            String jdbcUrl = "jdbc:mysql://" + host + ":" + p + "/" + d
                    + "?useSSL=true&requireSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8&autoReconnect=true";
            return new DbConfig(jdbcUrl, u, pwd);
        }

        // 3. Check legacy custom variables
        String envUrl = System.getenv("SMART_PARKING_DB_URL");
        String envUser = System.getenv("SMART_PARKING_DB_USER");
        String envPass = System.getenv("SMART_PARKING_DB_PASS");

        String url = (envUrl != null && !envUrl.trim().isEmpty()) ? envUrl : DEFAULT_URL;
        String user = (envUser != null && !envUser.trim().isEmpty()) ? envUser : DEFAULT_USER;
        String password = (envPass != null) ? envPass : DEFAULT_PASSWORD;

        return new DbConfig(url, user, password);
    }

    private static String getFirstEnv(String... names) {
        for (String name : names) {
            String val = System.getenv(name);
            if (val != null && !val.trim().isEmpty()) {
                return val.trim();
            }
        }
        return null;
    }

    private static synchronized void initializeHikariPool() {
        if (dataSource != null && !dataSource.isClosed()) return;
        try {
            DbConfig config = resolveConfig();
            HikariConfig hikariConfig = new HikariConfig();
            hikariConfig.setJdbcUrl(config.jdbcUrl);
            hikariConfig.setUsername(config.username);
            hikariConfig.setPassword(config.password);
            hikariConfig.setDriverClassName(DRIVER_CLASS);

            hikariConfig.setMaximumPoolSize(10);
            hikariConfig.setMinimumIdle(2);
            hikariConfig.setIdleTimeout(30000);
            hikariConfig.setConnectionTimeout(10000);
            hikariConfig.setMaxLifetime(600000); // 10 minutes
            hikariConfig.setPoolName("SmartParkingHikariPool");

            dataSource = new HikariDataSource(hikariConfig);
            System.out.println("[DBConnection] HikariCP Connection Pool initialized for URL: " + sanitizeUrl(config.jdbcUrl));
        } catch (Throwable t) {
            hikariFailed = true;
            System.err.println("[DBConnection WARN] HikariCP pool could not start. Fallback to direct JDBC. Reason: " + t.getMessage());
        }
    }

    public static Connection getConnection() throws SQLException {
        if (!hikariFailed && dataSource != null && !dataSource.isClosed()) {
            try {
                return dataSource.getConnection();
            } catch (SQLException ex) {
                System.err.println("[DBConnection] Hikari connection failed, falling back to direct DriverManager: " + ex.getMessage());
            }
        }

        // Direct JDBC fallback
        DbConfig cfg = resolveConfig();
        try {
            return DriverManager.getConnection(cfg.jdbcUrl, cfg.username, cfg.password);
        } catch (SQLException e) {
            System.err.println("[DBConnection ERROR] Failed to connect to MySQL database at: " + sanitizeUrl(cfg.jdbcUrl));
            throw e;
        }
    }

    private static String sanitizeUrl(String url) {
        if (url == null) return "null";
        return url.replaceAll("(?<=://)[^@]+@", "***:***@");
    }

    public static void closeResources(ResultSet rs, Statement stmt, Connection conn) {
        if (rs != null) {
            try { rs.close(); } catch (SQLException ignored) {}
        }
        if (stmt != null) {
            try { stmt.close(); } catch (SQLException ignored) {}
        }
        if (conn != null) {
            try { conn.close(); } catch (SQLException ignored) {}
        }
    }

    public static void closeResources(Statement stmt, Connection conn) {
        closeResources(null, stmt, conn);
    }
}
