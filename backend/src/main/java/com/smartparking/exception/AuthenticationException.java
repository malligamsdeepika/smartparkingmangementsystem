package com.smartparking.exception;

/**
 * Thrown when credentials fail, authorization is missing, or a user account is suspended.
 */
public class AuthenticationException extends Exception {
    private final int statusCode;

    public AuthenticationException(String message) {
        super(message);
        this.statusCode = 401;
    }

    public AuthenticationException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public AuthenticationException(String message, Throwable cause) {
        super(message, cause);
        this.statusCode = 500;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
