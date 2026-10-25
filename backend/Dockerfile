# ==============================================================================
# SMART PARKING MANAGEMENT SYSTEM - JAVA SERVLET BACKEND DOCKERFILE
# ==============================================================================
# Multi-stage production container build for Tomcat 10.1 (Jakarta EE 10) & Java 17.
# Compatible with:
# - Railway
# - Render
# - Google Cloud Run
# - AWS App Runner / ECS
# - DigitalOcean App Platform
# - Local Docker Desktop
# ==============================================================================

# STAGE 1: Build Java WAR with Maven
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source code and package WAR
COPY src ./src
COPY WebContent ./WebContent
RUN mvn clean package -DskipTests

# STAGE 2: Production Apache Tomcat 10.1 Runtime
FROM tomcat:10.1-jdk17-temurin-alpine

LABEL maintainer="Smart Parking Team"
LABEL description="Smart Parking Management System - Jakarta Servlet 6.0 Backend"

# Clear default Tomcat apps
RUN rm -rf /usr/local/tomcat/webapps/*

# Copy WAR file from builder stage
# Placed as ROOT.war so endpoints are accessible directly at /api/* without context path prefix
COPY --from=builder /app/target/*.war /usr/local/tomcat/webapps/ROOT.war

# Environment Defaults
ENV PORT=8080
ENV SMART_PARKING_DB_URL=""
ENV SMART_PARKING_DB_USER="root"
ENV SMART_PARKING_DB_PASS=""
ENV ALLOWED_ORIGINS="*"

# Startup script to dynamically adapt Tomcat server.xml to cloud $PORT (Render / Railway / Cloud Run requirement)
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'if [ -n "$PORT" ]; then' >> /entrypoint.sh && \
    echo '  sed -i "s/port=\"8080\"/port=\"$PORT\"/g" /usr/local/tomcat/conf/server.xml' >> /entrypoint.sh && \
    echo 'fi' >> /entrypoint.sh && \
    echo 'exec catalina.sh run' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
