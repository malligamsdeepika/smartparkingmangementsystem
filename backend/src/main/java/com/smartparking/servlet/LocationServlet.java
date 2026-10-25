package com.smartparking.servlet;

import com.google.gson.JsonObject;
import com.smartparking.dao.SlotDAO;
import com.smartparking.model.ParkingLocation;
import com.smartparking.util.JsonUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.SQLException;
import java.util.List;

/**
 * Servlet handling Parking Location endpoints:
 * - GET /api/locations      -> List all locations with capacity & live availability
 * - GET /api/locations/{id} -> Get single location details
 */
@WebServlet(name = "LocationServlet", urlPatterns = {"/api/locations", "/api/locations/*"})
public class LocationServlet extends HttpServlet {

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
            if (pathInfo != null && pathInfo.length() > 1) {
                int locId = Integer.parseInt(pathInfo.substring(1));
                ParkingLocation loc = slotDAO.getLocationById(locId);
                if (loc != null) {
                    JsonObject res = new JsonObject();
                    res.addProperty("success", true);
                    res.add("location", JsonUtil.getGson().toJsonTree(loc));
                    out.print(JsonUtil.toJson(res));
                } else {
                    resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    JsonObject res = new JsonObject();
                    res.addProperty("success", false);
                    res.addProperty("message", "Location not found with ID: " + locId);
                    out.print(JsonUtil.toJson(res));
                }
            } else {
                List<ParkingLocation> list = slotDAO.getAllLocations();
                JsonObject res = new JsonObject();
                res.addProperty("success", true);
                res.add("locations", JsonUtil.getGson().toJsonTree(list));
                out.print(JsonUtil.toJson(res));
            }
        } catch (NumberFormatException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Invalid Location ID format");
            out.print(JsonUtil.toJson(res));
        } catch (SQLException e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Database error: " + e.getMessage());
            out.print(JsonUtil.toJson(res));
        }
    }
}
