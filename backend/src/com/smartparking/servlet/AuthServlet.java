package com.smartparking.servlet;

import com.google.gson.JsonObject;
import com.smartparking.dao.UserDAO;
import com.smartparking.model.User;
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
 * Servlet handling Authentication endpoints:
 * - POST /api/auth/login    -> User & Admin login
 * - POST /api/auth/register -> User registration
 * - GET  /api/auth/users    -> List all registered users (Admin view)
 */
@WebServlet(name = "AuthServlet", urlPatterns = {"/api/auth/*"})
public class AuthServlet extends HttpServlet {

    private UserDAO userDAO;

    @Override
    public void init() throws ServletException {
        super.init();
        this.userDAO = new UserDAO();
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();
        String pathInfo = req.getPathInfo(); // e.g., "/login" or "/register"

        String requestBody = readRequestBody(req);

        if ("/login".equalsIgnoreCase(pathInfo)) {
            handleLogin(requestBody, resp, out);
        } else if ("/register".equalsIgnoreCase(pathInfo)) {
            handleRegister(requestBody, resp, out);
        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Endpoint not found: " + pathInfo);
            out.print(JsonUtil.toJson(res));
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();
        String pathInfo = req.getPathInfo();

        if ("/users".equalsIgnoreCase(pathInfo)) {
            try {
                List<User> users = userDAO.getAllUsers();
                JsonObject res = new JsonObject();
                res.addProperty("success", true);
                res.add("users", JsonUtil.getGson().toJsonTree(users));
                out.print(JsonUtil.toJson(res));
            } catch (SQLException e) {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                JsonObject res = new JsonObject();
                res.addProperty("success", false);
                res.addProperty("message", "Database error: " + e.getMessage());
                out.print(JsonUtil.toJson(res));
            }
        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Endpoint not found");
            out.print(JsonUtil.toJson(res));
        }
    }

    private void handleLogin(String body, HttpServletResponse resp, PrintWriter out) {
        JsonObject json = JsonUtil.fromJson(body, JsonObject.class);
        if (json == null || !json.has("email") || !json.has("password")) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Missing required fields: email and password");
            out.print(JsonUtil.toJson(res));
            return;
        }

        String email = json.get("email").getAsString();
        String password = json.get("password").getAsString();

        try {
            User user = userDAO.loginUser(email, password);
            if (user != null) {
                JsonObject res = new JsonObject();
                res.addProperty("success", true);
                res.addProperty("message", "Login successful");
                res.add("user", JsonUtil.getGson().toJsonTree(user));
                out.print(JsonUtil.toJson(res));
            } else {
                resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                JsonObject res = new JsonObject();
                res.addProperty("success", false);
                res.addProperty("message", "Invalid email or password");
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

    private void handleRegister(String body, HttpServletResponse resp, PrintWriter out) {
        User user = JsonUtil.fromJson(body, User.class);
        if (user == null || user.getEmail() == null || user.getPassword() == null || user.getName() == null) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Missing required fields: name, email, password");
            out.print(JsonUtil.toJson(res));
            return;
        }

        try {
            // Check if email already registered
            User existing = userDAO.getUserByEmail(user.getEmail());
            if (existing != null) {
                resp.setStatus(HttpServletResponse.SC_CONFLICT);
                JsonObject res = new JsonObject();
                res.addProperty("success", false);
                res.addProperty("message", "Email is already registered. Please login.");
                out.print(JsonUtil.toJson(res));
                return;
            }

            User created = userDAO.registerUser(user);
            resp.setStatus(HttpServletResponse.SC_CREATED);
            JsonObject res = new JsonObject();
            res.addProperty("success", true);
            res.addProperty("message", "User registered successfully");
            res.add("user", JsonUtil.getGson().toJsonTree(created));
            out.print(JsonUtil.toJson(res));

        } catch (SQLException e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Database error: " + e.getMessage());
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
