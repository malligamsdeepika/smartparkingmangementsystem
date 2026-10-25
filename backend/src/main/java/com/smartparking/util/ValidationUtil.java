package com.smartparking.util;

import java.util.regex.Pattern;

/**
 * Validation utilities for inputs such as email, phone numbers, vehicle registration, and lengths.
 */
public class ValidationUtil {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$");

    private static final Pattern PHONE_PATTERN =
            Pattern.compile("^[0-9]{10,15}$");

    private static final Pattern VEHICLE_NUM_PATTERN =
            Pattern.compile("^[A-Z0-9-]{4,20}$");

    public static boolean isValidEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email.trim()).matches();
    }

    public static boolean isValidPhone(String phone) {
        return phone != null && PHONE_PATTERN.matcher(phone.trim().replaceAll("[\\s-]", "")).matches();
    }

    public static boolean isValidVehicleNumber(String vehicleNumber) {
        return vehicleNumber != null && VEHICLE_NUM_PATTERN.matcher(vehicleNumber.trim().toUpperCase()).matches();
    }

    public static boolean isNotEmpty(String str) {
        return str != null && !str.trim().isEmpty();
    }
}
