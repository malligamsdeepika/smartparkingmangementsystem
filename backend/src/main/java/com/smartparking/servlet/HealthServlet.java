package com.smartparking.servlet;

import com.google.gson.JsonObject;
import com.smartparking.dao.DBConnection;
import com.smartparking.util.JsonUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.Instant;

/**
 * Cloud Health Check & Diagnostics Servlet.
 * Used by cloud orchestrators (Render, Railway, AWS ECS, GCP Cloud Run)
 * to verify that the container is healthy and connected to the database.
 */
@WebServlet(name = "HealthServlet", urlPatterns = {"/api/health"})
public class HealthServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();

        JsonObject health = new JsonObject();
        health.addProperty("service", "smart-parking-backend");
        health.addProperty("timestamp", Instant.now().toString());

        boolean dbOk = false;
        long dbLatencyMs = -1;

        try {
            long start = System.currentTimeMillis();
            try (Connection conn = DBConnection.getConnection();
                 Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT 1")) {
                if (rs.next()) {
                    dbOk = true;
                    dbLatencyMs = System.currentTimeMillis() - start;
                }
            }
        } catch (Exception e) {
            health.addProperty("databaseError", e.getMessage());
        }

        health.addProperty("status", dbOk ? "UP" : "DEGRADED");
        health.addProperty("database", dbOk ? "CONNECTED" : "DISCONNECTED");
        if (dbLatencyMs >= 0) {
            health.addProperty("dbLatencyMs", dbLatencyMs);
        }

        JsonObject systemInfo = new JsonObject();
        systemInfo.addProperty("javaVersion", System.getProperty("java.version"));
        systemInfo.addProperty("availableProcessors", Runtime.getRuntime().availableProcessors());
        systemInfo.addProperty("freeMemoryMB", Runtime.getRuntime().freeMemory() / (1024 * 1024));
        systemInfo.addProperty("totalMemoryMB", Runtime.getRuntime().totalMemory() / (1024 * 1024));
        health.add("system", systemInfo);

        if (!dbOk) {
            resp.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
        } else {
            resp.setStatus(HttpServletResponse.SC_OK);
        }

        out.print(JsonUtil.toJson(health));
    }
}
