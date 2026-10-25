package com.smartparking.servlet;

import com.google.gson.JsonObject;
import com.smartparking.dao.PaymentDAO;
import com.smartparking.model.Payment;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Servlet handling Payment transaction endpoints:
 * - POST /api/payments              -> Process payment for a booking
 * - GET  /api/payments?bookingId=X  -> Get payment receipt by booking
 * - GET  /api/payments              -> List all transactions (Admin Revenue)
 */
@WebServlet(name = "PaymentServlet", urlPatterns = {"/api/payments"})
public class PaymentServlet extends HttpServlet {

    private PaymentDAO paymentDAO;

    @Override
    public void init() throws ServletException {
        super.init();
        this.paymentDAO = new PaymentDAO();
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();

        String bookingIdParam = req.getParameter("bookingId");
        try {
            if (bookingIdParam != null && !bookingIdParam.trim().isEmpty()) {
                int bookingId = Integer.parseInt(bookingIdParam.trim());
                Payment payment = paymentDAO.getPaymentByBookingId(bookingId);
                if (payment != null) {
                    JsonObject res = new JsonObject();
                    res.addProperty("success", true);
                    res.add("payment", JsonUtil.getGson().toJsonTree(payment));
                    out.print(JsonUtil.toJson(res));
                } else {
                    resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    JsonObject res = new JsonObject();
                    res.addProperty("success", false);
                    res.addProperty("message", "No payment found for booking ID: " + bookingId);
                    out.print(JsonUtil.toJson(res));
                }
            } else {
                List<Payment> list = paymentDAO.getAllPayments();
                JsonObject res = new JsonObject();
                res.addProperty("success", true);
                res.add("payments", JsonUtil.getGson().toJsonTree(list));
                out.print(JsonUtil.toJson(res));
            }
        } catch (NumberFormatException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Invalid booking ID format");
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

        Payment payment = JsonUtil.fromJson(body, Payment.class);
        if (payment == null || payment.getBookingId() <= 0 || payment.getAmount() <= 0) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Invalid payment payload. bookingId and valid amount are required.");
            out.print(JsonUtil.toJson(res));
            return;
        }

        if (payment.getTransactionId() == null || payment.getTransactionId().trim().isEmpty()) {
            payment.setTransactionId("TXN_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        }
        if (payment.getPaymentStatus() == null) {
            payment.setPaymentStatus("SUCCESS");
        }
        if (payment.getPaidAt() == null) {
            payment.setPaidAt(LocalDateTime.now());
        }

        try {
            Payment saved = paymentDAO.processPayment(payment);
            resp.setStatus(HttpServletResponse.SC_CREATED);
            JsonObject res = new JsonObject();
            res.addProperty("success", true);
            res.addProperty("message", "Payment processed successfully");
            res.add("payment", JsonUtil.getGson().toJsonTree(saved));
            out.print(JsonUtil.toJson(res));
        } catch (SQLException e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            JsonObject res = new JsonObject();
            res.addProperty("success", false);
            res.addProperty("message", "Payment processing failed: " + e.getMessage());
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
