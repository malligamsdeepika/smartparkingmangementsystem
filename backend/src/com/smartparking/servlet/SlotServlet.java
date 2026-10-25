package com.smartparking.servlet;

import com.google.gson.JsonObject;
import com.smartparking.dao.SlotDAO;
import com.smartparking.model.ParkingSlot;
import com.smartparking.util.JsonUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.SQLException;
import java.util.List;

/**
 * Servlet handling Parking Slots endpoints:
 * - GET    /api/slots                     -> List all slots (optional ?locationId=X & ?availableOnly=true)
 * - GET    /api/slots/{id}                -> Get single slot
 * - PUT    /api/slots/{id}/status         -> Update status (AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE)
 * - POST   /api/slots                     -> Add new slot (Admin)
 * - DELETE /api/slots/{id}                -> Delete slot (Admin)
 */
@WebServlet(name = "SlotServlet", urlPatterns = {"/api/slots", "/api/slots/*"})
public class SlotServlet extends HttpServlet {

    private SlotDAO slotDAO;

    @Override
    public void init() throws ServletException {
        super.init();
        this.slotDAO = new SlotDAO();
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();
        String pathInfo = req.getPathInfo();

        try {
            // Case 1: /api/slots/{id}
            if (pathInfo != null && pathInfo.length() > 1) {
                String idStr = pathInfo.substring(1);
                int slotId = Integer.parseInt(idStr);
                ParkingSlot slot = slotDAO.getSlotById(slotId);
                if (slot != null) {
                    JsonObject res = new JsonObject();
                    res.addProperty("success", true);
                    res.add("slot", JsonUtil.getGson().toJsonTree(slot));
                    out.print(JsonUtil.toJson(res));
                } else {
                    resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    JsonObject res = new JsonObject();
                    res.addProperty("success", false);
                    res.addProperty("message", "Slot not found with ID: " + slotId);
                    out.print(JsonUtil.toJson(res));
                }
                return;
            }

            // Case 2: /api/slots?locationId=X&availableOnly=true
            String locParam = req.getParameter("locationId");
            String availParam = req.getParameter("availableOnly");

            List<ParkingSlot> list;
            if (locParam != null && !locParam.trim().isEmpty()) {
                int locId = Integer.parseInt(locParam.trim());
                if ("true".equalsIgnoreCase(availParam)) {
                    list = slotDAO.getAvailableSlots(locId);
                } else {
                    list = slotDAO.getSlotsByLocation(locId);
                }
            } else {
                list = slotDAO.getAllSlots();
            }

            JsonObject res = new JsonObject();
            res.addProperty("success", true);
            res.add("slots", JsonUtil.getGson().toJsonTree(list));
            out.print(JsonUtil.toJson(res));

        } catch (NumberFormatException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Invalid ID format: " + e.getMessage());
            out.print(JsonUtil.toJson(res));
        } catch (SQLException e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Database error: " + e.getMessage());
            out.print(JsonUtil.toJson(res));
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();
        String body = readRequestBody(req);

        ParkingSlot slot = JsonUtil.fromJson(body, ParkingSlot.class);
        if (slot == null || slot.getLocationId() <= 0 || slot.getSlotNumber() == null) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Invalid slot payload. locationId and slotNumber are required.");
            out.print(JsonUtil.toJson(res));
            return;
        }

        try {
            boolean created = slotDAO.addSlot(slot);
            if (created) {
                resp.setStatus(HttpServletResponse.SC_CREATED);
                JsonObject res = new JsonObject();
                res.addProperty("success", true);
                res.addProperty("message", "Slot created successfully");
                out.print(JsonUtil.toJson(res));
            } else {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                JsonObject res = new JsonObject();
                res.addProperty("success", false);
                res.addProperty("message", "Failed to create slot");
                out.print(JsonUtil.toJson(res));
            }
        } catch (SQLException e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Database error: " + e.getMessage());
            out.print(JsonUtil.toJson(res));
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();
        String pathInfo = req.getPathInfo(); // e.g. /12/status or /12

        if (pathInfo == null || pathInfo.length() <= 1) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Slot ID missing in URL path");
            out.print(JsonUtil.toJson(res));
            return;
        }

        String[] parts = pathInfo.split("/");
        // parts[0] is empty, parts[1] is slotId
        int slotId;
        try {
            slotId = Integer.parseInt(parts[1]);
        } catch (NumberFormatException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Invalid slot ID");
            out.print(JsonUtil.toJson(res));
            return;
        }

        String body = readRequestBody(req);
        JsonObject json = JsonUtil.fromJson(body, JsonObject.class);
        if (json == null || !json.has("status")) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Payload must specify 'status'");
            out.print(JsonUtil.toJson(res));
            return;
        }

        String status = json.get("status").getAsString().toUpperCase();
        try {
            boolean updated = slotDAO.updateSlotStatus(slotId, status);
            JsonObject res = new JsonObject();
            res.addProperty("success", updated);
            res.addProperty("message", updated ? "Slot status updated to " + status : "Slot not found");
            out.print(JsonUtil.toJson(res));
        } catch (SQLException e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Database error: " + e.getMessage());
            out.print(JsonUtil.toJson(res));
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();
        String pathInfo = req.getPathInfo();

        if (pathInfo == null || pathInfo.length() <= 1) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Slot ID missing in URL path");
            out.print(JsonUtil.toJson(res));
            return;
        }

        try {
            int slotId = Integer.parseInt(pathInfo.substring(1));
            boolean deleted = slotDAO.deleteSlot(slotId);
            JsonObject res = new JsonObject();
            res.addProperty("success", deleted);
            res.addProperty("message", deleted ? "Slot deleted successfully" : "Slot not found");
            out.print(JsonUtil.toJson(res));
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Error deleting slot: " + e.getMessage());
            out.print(JsonUtil.toJson(res));
        }
    }

    private String readRequestBody(HttpServletRequest req) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        return sb.toString();
    }
}
