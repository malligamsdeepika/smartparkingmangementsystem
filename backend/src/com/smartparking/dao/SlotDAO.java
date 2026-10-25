package com.smartparking.dao;

import com.smartparking.model.ParkingLocation;
import com.smartparking.model.ParkingSlot;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object (DAO) for Parking Locations and Slots (Bays).
 */
public class SlotDAO {

    /**
     * Retrieves all parking slots across all locations with location names.
     */
    public List<ParkingSlot> getAllSlots() throws SQLException {
        String sql = "SELECT s.id, s.location_id, s.slot_number, s.floor, s.slot_type, s.vehicle_type, s.status, s.hourly_rate, l.name as location_name " +
                     "FROM parking_slots s " +
                     "JOIN parking_locations l ON s.location_id = l.id " +
                     "ORDER BY s.location_id ASC, s.floor ASC, s.slot_number ASC";
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        List<ParkingSlot> slots = new ArrayList<>();

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql);
            rs = stmt.executeQuery();

            while (rs.next()) {
                ParkingSlot slot = new ParkingSlot();
                slot.setId(rs.getInt("id"));
                slot.setLocationId(rs.getInt("location_id"));
                slot.setSlotNumber(rs.getString("slot_number"));
                slot.setFloor(rs.getString("floor"));
                slot.setSlotType(rs.getString("slot_type"));
                slot.setVehicleType(rs.getString("vehicle_type"));
                slot.setStatus(rs.getString("status"));
                slot.setHourlyRate(rs.getDouble("hourly_rate"));
                slot.setLocationName(rs.getString("location_name"));
                slots.add(slot);
            }
            return slots;
        } finally {
            DBConnection.closeResources(rs, stmt, conn);
        }
    }

    /**
     * Retrieves slots for a specific location.
     */
    public List<ParkingSlot> getSlotsByLocation(int locationId) throws SQLException {
        String sql = "SELECT s.id, s.location_id, s.slot_number, s.floor, s.slot_type, s.vehicle_type, s.status, s.hourly_rate, l.name as location_name " +
                     "FROM parking_slots s " +
                     "JOIN parking_locations l ON s.location_id = l.id " +
                     "WHERE s.location_id = ? " +
                     "ORDER BY s.floor ASC, s.slot_number ASC";
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        List<ParkingSlot> slots = new ArrayList<>();

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql);
            stmt.setInt(1, locationId);
            rs = stmt.executeQuery();

            while (rs.next()) {
                ParkingSlot slot = new ParkingSlot();
                slot.setId(rs.getInt("id"));
                slot.setLocationId(rs.getInt("location_id"));
                slot.setSlotNumber(rs.getString("slot_number"));
                slot.setFloor(rs.getString("floor"));
                slot.setSlotType(rs.getString("slot_type"));
                slot.setVehicleType(rs.getString("vehicle_type"));
                slot.setStatus(rs.getString("status"));
                slot.setHourlyRate(rs.getDouble("hourly_rate"));
                slot.setLocationName(rs.getString("location_name"));
                slots.add(slot);
            }
            return slots;
        } finally {
            DBConnection.closeResources(rs, stmt, conn);
        }
    }

    /**
     * Retrieves only AVAILABLE slots for a specific location.
     */
    public List<ParkingSlot> getAvailableSlots(int locationId) throws SQLException {
        String sql = "SELECT s.id, s.location_id, s.slot_number, s.floor, s.slot_type, s.vehicle_type, s.status, s.hourly_rate, l.name as location_name " +
                     "FROM parking_slots s " +
                     "JOIN parking_locations l ON s.location_id = l.id " +
                     "WHERE s.location_id = ? AND s.status = 'AVAILABLE' " +
                     "ORDER BY s.floor ASC, s.slot_number ASC";
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        List<ParkingSlot> slots = new ArrayList<>();

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql);
            stmt.setInt(1, locationId);
            rs = stmt.executeQuery();

            while (rs.next()) {
                ParkingSlot slot = new ParkingSlot();
                slot.setId(rs.getInt("id"));
                slot.setLocationId(rs.getInt("location_id"));
                slot.setSlotNumber(rs.getString("slot_number"));
                slot.setFloor(rs.getString("floor"));
                slot.setSlotType(rs.getString("slot_type"));
                slot.setVehicleType(rs.getString("vehicle_type"));
                slot.setStatus(rs.getString("status"));
                slot.setHourlyRate(rs.getDouble("hourly_rate"));
                slot.setLocationName(rs.getString("location_name"));
                slots.add(slot);
            }
            return slots;
        } finally {
            DBConnection.closeResources(rs, stmt, conn);
        }
    }

    /**
     * Finds a slot by its primary key ID.
     */
    public ParkingSlot getSlotById(int id) throws SQLException {
        String sql = "SELECT s.id, s.location_id, s.slot_number, s.floor, s.slot_type, s.vehicle_type, s.status, s.hourly_rate, l.name as location_name " +
                     "FROM parking_slots s " +
                     "JOIN parking_locations l ON s.location_id = l.id " +
                     "WHERE s.id = ?";
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql);
            stmt.setInt(1, id);
            rs = stmt.executeQuery();

            if (rs.next()) {
                ParkingSlot slot = new ParkingSlot();
                slot.setId(rs.getInt("id"));
                slot.setLocationId(rs.getInt("location_id"));
                slot.setSlotNumber(rs.getString("slot_number"));
                slot.setFloor(rs.getString("floor"));
                slot.setSlotType(rs.getString("slot_type"));
                slot.setVehicleType(rs.getString("vehicle_type"));
                slot.setStatus(rs.getString("status"));
                slot.setHourlyRate(rs.getDouble("hourly_rate"));
                slot.setLocationName(rs.getString("location_name"));
                return slot;
            }
            return null;
        } finally {
            DBConnection.closeResources(rs, stmt, conn);
        }
    }

    /**
     * Resilient slot locator matching by ID, (locationId + slotNumber), or location's first available slot.
     */
    public ParkingSlot findSlot(int preferredId, int locationId, String slotNumber) throws SQLException {
        if (preferredId > 0) {
            ParkingSlot direct = getSlotById(preferredId);
            if (direct != null) return direct;
        }

        if (locationId > 0 && slotNumber != null && !slotNumber.trim().isEmpty()) {
            String sql = "SELECT s.id, s.location_id, s.slot_number, s.floor, s.slot_type, s.vehicle_type, s.status, s.hourly_rate, l.name as location_name " +
                         "FROM parking_slots s " +
                         "JOIN parking_locations l ON s.location_id = l.id " +
                         "WHERE s.location_id = ? AND UPPER(s.slot_number) = UPPER(?) LIMIT 1";
            Connection conn = null;
            PreparedStatement stmt = null;
            ResultSet rs = null;
            try {
                conn = DBConnection.getConnection();
                stmt = conn.prepareStatement(sql);
                stmt.setInt(1, locationId);
                stmt.setString(2, slotNumber.trim());
                rs = stmt.executeQuery();
                if (rs.next()) {
                    ParkingSlot slot = new ParkingSlot();
                    slot.setId(rs.getInt("id"));
                    slot.setLocationId(rs.getInt("location_id"));
                    slot.setSlotNumber(rs.getString("slot_number"));
                    slot.setFloor(rs.getString("floor"));
                    slot.setSlotType(rs.getString("slot_type"));
                    slot.setVehicleType(rs.getString("vehicle_type"));
                    slot.setStatus(rs.getString("status"));
                    slot.setHourlyRate(rs.getDouble("hourly_rate"));
                    slot.setLocationName(rs.getString("location_name"));
                    return slot;
                }
            } finally {
                DBConnection.closeResources(rs, stmt, conn);
            }
        }

        // Fallback: Return first available slot in target location (or location 1)
        List<ParkingSlot> avail = getAvailableSlots(locationId > 0 ? locationId : 1);
        if (!avail.isEmpty()) {
            return avail.get(0);
        }
        return getSlotById(1);
    }

    /**
     * Updates slot status ("AVAILABLE", "RESERVED", "OCCUPIED", "MAINTENANCE").
     */
    public boolean updateSlotStatus(int slotId, String status) throws SQLException {
        String sql = "UPDATE parking_slots SET status = ? WHERE id = ?";
        Connection conn = null;
        PreparedStatement stmt = null;

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql);
            stmt.setString(1, status);
            stmt.setInt(2, slotId);

            return stmt.executeUpdate() > 0;
        } finally {
            DBConnection.closeResources(stmt, conn);
        }
    }

    /**
     * Adds a new parking slot (Admin feature).
     */
    public boolean addSlot(ParkingSlot slot) throws SQLException {
        String sql = "INSERT INTO parking_slots (location_id, slot_number, floor, slot_type, vehicle_type, status, hourly_rate) VALUES (?, ?, ?, ?, ?, ?, ?)";
        Connection conn = null;
        PreparedStatement stmt = null;

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql);
            stmt.setInt(1, slot.getLocationId());
            stmt.setString(2, slot.getSlotNumber());
            stmt.setString(3, slot.getFloor());
            stmt.setString(4, slot.getSlotType());
            stmt.setString(5, slot.getVehicleType());
            stmt.setString(6, (slot.getStatus() != null) ? slot.getStatus() : "AVAILABLE");
            stmt.setDouble(7, slot.getHourlyRate());

            return stmt.executeUpdate() > 0;
        } finally {
            DBConnection.closeResources(stmt, conn);
        }
    }

    /**
     * Deletes a slot by ID.
     */
    public boolean deleteSlot(int slotId) throws SQLException {
        String sql = "DELETE FROM parking_slots WHERE id = ?";
        Connection conn = null;
        PreparedStatement stmt = null;

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql);
            stmt.setInt(1, slotId);

            return stmt.executeUpdate() > 0;
        } finally {
            DBConnection.closeResources(stmt, conn);
        }
    }

    /**
     * Retrieves all parking locations with calculated slot statistics.
     */
    public List<ParkingLocation> getAllLocations() throws SQLException {
        String sql = "SELECT l.id, l.name, l.address, l.city, l.total_slots, l.latitude, l.longitude, l.created_at, " +
                     "COALESCE(SUM(CASE WHEN s.status = 'AVAILABLE' THEN 1 ELSE 0 END), 0) as available_slots, " +
                     "COALESCE(MIN(s.hourly_rate), 20.00) as starting_rate " +
                     "FROM parking_locations l " +
                     "LEFT JOIN parking_slots s ON l.id = s.location_id " +
                     "GROUP BY l.id, l.name, l.address, l.city, l.total_slots, l.latitude, l.longitude, l.created_at " +
                     "ORDER BY l.id ASC";
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        List<ParkingLocation> locations = new ArrayList<>();

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql);
            rs = stmt.executeQuery();

            while (rs.next()) {
                ParkingLocation loc = new ParkingLocation();
                loc.setId(rs.getInt("id"));
                loc.setName(rs.getString("name"));
                loc.setAddress(rs.getString("address"));
                loc.setCity(rs.getString("city"));
                loc.setTotalSlots(rs.getInt("total_slots"));
                loc.setLatitude(rs.getDouble("latitude"));
                loc.setLongitude(rs.getDouble("longitude"));
                loc.setAvailableSlots(rs.getInt("available_slots"));
                loc.setStartingRate(rs.getDouble("starting_rate"));
                locations.add(loc);
            }
            return locations;
        } finally {
            DBConnection.closeResources(rs, stmt, conn);
        }
    }

    /**
     * Retrieves location by ID.
     */
    public ParkingLocation getLocationById(int id) throws SQLException {
        String sql = "SELECT id, name, address, city, total_slots, latitude, longitude, created_at FROM parking_locations WHERE id = ?";
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;

        try {
            conn = DBConnection.getConnection();
            stmt = conn.prepareStatement(sql);
            stmt.setInt(1, id);
            rs = stmt.executeQuery();

            if (rs.next()) {
                ParkingLocation loc = new ParkingLocation();
                loc.setId(rs.getInt("id"));
                loc.setName(rs.getString("name"));
                loc.setAddress(rs.getString("address"));
                loc.setCity(rs.getString("city"));
                loc.setTotalSlots(rs.getInt("total_slots"));
                loc.setLatitude(rs.getDouble("latitude"));
                loc.setLongitude(rs.getDouble("longitude"));
                return loc;
            }
            return null;
        } finally {
            DBConnection.closeResources(rs, stmt, conn);
        }
    }
}
