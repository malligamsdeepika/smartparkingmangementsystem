package com.smartparking.servlet;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Cross-Origin Resource Sharing (CORS) Filter for Cloud and Local Deployments.
 * Allows the React frontend (running on Vercel, Netlify, Render, Cloud Run, or localhost)
 * and mobile browsers to securely communicate with the Java backend APIs.
 */
@WebFilter("/*")
public class CorsFilter implements Filter {

    private Set<String> allowedOrigins = new HashSet<>();
    private boolean allowAll = true;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        String envOrigins = System.getenv("ALLOWED_ORIGINS");
        if (envOrigins != null && !envOrigins.trim().isEmpty() && !envOrigins.trim().equals("*")) {
            String[] parts = envOrigins.split(",");
            for (String p : parts) {
                if (!p.trim().isEmpty()) {
                    allowedOrigins.add(p.trim().toLowerCase());
                }
            }
            allowAll = false;
        } else {
            allowAll = true;
        }
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        String origin = req.getHeader("Origin");

        if (allowAll || origin == null) {
            res.setHeader("Access-Control-Allow-Origin", origin != null ? origin : "*");
        } else if (allowedOrigins.contains(origin.toLowerCase())) {
            res.setHeader("Access-Control-Allow-Origin", origin);
            res.setHeader("Access-Control-Allow-Credentials", "true");
        } else {
            // Default permissive for college project deployment demo across devices
            res.setHeader("Access-Control-Allow-Origin", origin);
        }

        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
        res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-App-Version, Last-Event-ID");
        res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Type, X-Server-Time");
        res.setHeader("Access-Control-Max-Age", "86400");

        // Fast return for pre-flight OPTIONS request
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            res.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
    }
}

