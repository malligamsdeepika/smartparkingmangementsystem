package com.smartparking.servlet;

import com.google.gson.JsonObject;
import com.smartparking.dao.NotificationDAO;
import com.smartparking.model.Notification;
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
 * Servlet handling Administrator Notifications:
 * - GET  /api/admin/notifications              -> Retrieve latest notifications (?filter=unread, ?type=X, ?limit=N)
 * - GET  /api/admin/notifications/unread-count -> Retrieve count of unread notifications
 * - PUT  /api/admin/notifications/{id}/read    -> Mark single notification as read
 * - PUT  /api/admin/notifications/read-all     -> Mark all notifications as read
 */
@WebServlet(name = "NotificationServlet", urlPatterns = {"/api/admin/notifications", "/api/admin/notifications/*"})
public class NotificationServlet extends HttpServlet {

    private NotificationDAO notificationDAO;

    @Override
    public void init() throws ServletException {
        super.init();
        this.notificationDAO = new NotificationDAO();
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();
        String pathInfo = req.getPathInfo();

        try {
            // Case 1: /api/admin/notifications/unread-count
            if (pathInfo != null && "/unread-count".equalsIgnoreCase(pathInfo.trim())) {
                int count = notificationDAO.getUnreadAdminCount();
                JsonObject res = new JsonObject();
                res.addProperty("success", true);
                res.addProperty("count", count);
                res.addProperty("unreadCount", count);
                out.print(JsonUtil.toJson(res));
                return;
            }

            // Case 2: /api/admin/notifications (List notifications with optional filters)
            String filter = req.getParameter("filter");
            String type = req.getParameter("type");
            String limitParam = req.getParameter("limit");
            int limit = 50;
            if (limitParam != null && !limitParam.trim().isEmpty()) {
                try { limit = Integer.parseInt(limitParam.trim()); } catch (NumberFormatException ignored) {}
            }

            List<Notification> list = notificationDAO.getAdminNotifications(filter, type, limit);
            int unreadCount = notificationDAO.getUnreadAdminCount();

            JsonObject res = new JsonObject();
            res.addProperty("success", true);
            res.addProperty("total", list.size());
            res.addProperty("unreadCount", unreadCount);
            res.add("notifications", JsonUtil.getGson().toJsonTree(list));
            res.add("data", JsonUtil.getGson().toJsonTree(list));
            out.print(JsonUtil.toJson(res));

        } catch (SQLException e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Database error loading notifications: " + e.getMessage());
            out.print(JsonUtil.toJson(res));
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();
        String pathInfo = req.getPathInfo();

        if (pathInfo == null || pathInfo.length() <= 1) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Target notification ID or action missing in path.");
            out.print(JsonUtil.toJson(res));
            return;
        }

        try {
            // Case 1: /read-all
            if ("/read-all".equalsIgnoreCase(pathInfo.trim())) {
                int count = notificationDAO.markAllAsRead();
                JsonObject res = new JsonObject();
                res.addProperty("success", true);
                res.addProperty("message", "All notifications marked as read");
                res.addProperty("markedCount", count);
                res.addProperty("unreadCount", 0);
                out.print(JsonUtil.toJson(res));
                return;
            }

            // Case 2: /{id}/read
            String clean = pathInfo.startsWith("/") ? pathInfo.substring(1) : pathInfo;
            String notifId = clean.replace("/read", "").trim();

            boolean ok = notificationDAO.markAsRead(notifId);
            int unread = notificationDAO.getUnreadAdminCount();

            JsonObject res = new JsonObject();
            res.addProperty("success", ok);
            res.addProperty("message", ok ? "Notification marked as read" : "Notification not found");
            res.addProperty("unreadCount", unread);
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
