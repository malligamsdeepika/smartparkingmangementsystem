package com.smartparking.dao;

import com.smartparking.model.User;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object (DAO) for User operations.
 * Uses PreparedStatements for all database interactions.
 */
public class UserDAO {

    /**
     * Registers a new user into the users table.
     * 
     * @param user User object containing name, email, password, phone, role
     * @return User object populated with auto-generated id (password cleared)
     * @throws SQLException if email already exists or connection fails
     */
    public User registerUser(User user) throws SQLException {
        String sql = "INSERT INTO users (name, email, password, phone, role, created_at) VALUES (?, ?, ?, ?, ?, ?)";
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);

            stmt.setString(1, user.getName());
            stmt.setString(2, user.getEmail().trim().toLowerCase());
            stmt.setString(3, user.getPassword()); // In production, hash with BCrypt
            stmt.setString(4, user.getPhone());
            stmt.setString(5, (user.getRole() != null) ? user.getRole() : "USER");
            stmt.setTimestamp(6, Timestamp.valueOf(user.getCreatedAt() != null ? user.getCreatedAt() : java.time.LocalDateTime.now()));

            int affectedRows = stmt.executeUpdate();
            if (affectedRows == 0) {
                throw new SQLException("Creating user failed, no rows affected.");
            }

            rs = stmt.getGeneratedKeys();
            if (rs.next()) {
                user.setId(rs.getInt(1));
            }

            // Sanitized user object (strip password before returning)
            User safeUser = new User(user.getId(), user.getName(), user.getEmail(), "", user.getPhone(), user.getRole(), user.getCreatedAt());
            return safeUser;

        } finally {
            DBConnection.closeResources(rs, stmt, conn);
        }
    }

    /**
     * Authenticates user with email and password.
     * 
     * @param email User email
     * @param password Raw or hashed password
     * @return Authenticated User without password field, or null if invalid
     * @throws SQLException on database error
     */
    public User loginUser(String email, String password) throws SQLException {
        String sql = "SELECT id, name, email, password, phone, role, created_at FROM users WHERE email = ?";
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql);
            stmt.setString(1, email.trim().toLowerCase());

            rs = stmt.executeQuery();
            if (rs.next()) {
                String storedPassword = rs.getString("password");
                // In demo/college project, compare password string directly
                if (storedPassword != null && storedPassword.equals(password)) {
                    User user = new User();
                    user.setId(rs.getInt("id"));
                    user.setName(rs.getString("name"));
                    user.setEmail(rs.getString("email"));
                    user.setPassword(""); // Do not expose password
                    user.setPhone(rs.getString("phone"));
                    user.setRole(rs.getString("role"));
                    Timestamp ts = rs.getTimestamp("created_at");
                    if (ts != null) {
                        user.setCreatedAt(ts.toLocalDateTime());
                    }
                    return user;
                }
            }
            return null; // Authentication failed
        } finally {
            DBConnection.closeResources(rs, stmt, conn);
        }
    }

    /**
     * Retrieves user by primary key ID.
     */
    public User getUserById(int id) throws SQLException {
        String sql = "SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?";
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql);
            stmt.setInt(1, id);

            rs = stmt.executeQuery();
            if (rs.next()) {
                User user = new User();
                user.setId(rs.getInt("id"));
                user.setName(rs.getString("name"));
                user.setEmail(rs.getString("email"));
                user.setPassword(""); // Do not expose
                user.setPhone(rs.getString("phone"));
                user.setRole(rs.getString("role"));
                Timestamp ts = rs.getTimestamp("created_at");
                if (ts != null) {
                    user.setCreatedAt(ts.toLocalDateTime());
                }
                return user;
            }
            return null;
        } finally {
            DBConnection.closeResources(rs, stmt, conn);
        }
    }

    /**
     * Retrieves user by unique email.
     */
    public User getUserByEmail(String email) throws SQLException {
        String sql = "SELECT id, name, email, phone, role, created_at FROM users WHERE email = ?";
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql);
            stmt.setString(1, email.trim().toLowerCase());

            rs = stmt.executeQuery();
            if (rs.next()) {
                User user = new User();
                user.setId(rs.getInt("id"));
                user.setName(rs.getString("name"));
                user.setEmail(rs.getString("email"));
                user.setPassword("");
                user.setPhone(rs.getString("phone"));
                user.setRole(rs.getString("role"));
                Timestamp ts = rs.getTimestamp("created_at");
                if (ts != null) {
                    user.setCreatedAt(ts.toLocalDateTime());
                }
                return user;
            }
            return null;
        } finally {
            DBConnection.closeResources(rs, stmt, conn);
        }
    }

    /**
     * Updates user details (name, phone, role).
     */
    public boolean updateUser(User user) throws SQLException {
        String sql = "UPDATE users SET name = ?, phone = ?, role = ? WHERE id = ?";
        Connection conn = null;
        PreparedStatement stmt = null;

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql);
            stmt.setString(1, user.getName());
            stmt.setString(2, user.getPhone());
            stmt.setString(3, user.getRole());
            stmt.setInt(4, user.getId());

            return stmt.executeUpdate() > 0;
        } finally {
            DBConnection.closeResources(stmt, conn);
        }
    }

    /**
     * Deletes user record by ID.
     */
    public boolean deleteUser(int id) throws SQLException {
        String sql = "DELETE FROM users WHERE id = ?";
        Connection conn = null;
        PreparedStatement stmt = null;

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql);
            stmt.setInt(1, id);

            return stmt.executeUpdate() > 0;
        } finally {
            DBConnection.closeResources(stmt, conn);
        }
    }

    /**
     * Lists all registered users (for Admin Dashboard).
     */
    public List<User> getAllUsers() throws SQLException {
        String sql = "SELECT id, name, email, phone, role, created_at FROM users ORDER BY id ASC";
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        List<User> list = new ArrayList<>();

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql);
            rs = stmt.executeQuery();

            while (rs.next()) {
                User user = new User();
                user.setId(rs.getInt("id"));
                user.setName(rs.getString("name"));
                user.setEmail(rs.getString("email"));
                user.setPassword("");
                user.setPhone(rs.getString("phone"));
                user.setRole(rs.getString("role"));
                Timestamp ts = rs.getTimestamp("created_at");
                if (ts != null) {
                    user.setCreatedAt(ts.toLocalDateTime());
                }
                list.add(user);
            }
            return list;
        } finally {
            DBConnection.closeResources(rs, stmt, conn);
        }
    }
}
