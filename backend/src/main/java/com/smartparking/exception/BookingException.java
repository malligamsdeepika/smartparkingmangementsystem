package com.smartparking.exception;

/**
 * Thrown when an error occurs during slot booking, slot concurrency conflict,
 * or validation of vehicle/times.
 */
public class BookingException extends Exception {
    private final int statusCode;

    public BookingException(String message) {
        super(message);
        this.statusCode = 400;
    }

    public BookingException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public BookingException(String message, Throwable cause) {
        super(message, cause);
        this.statusCode = 500;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
