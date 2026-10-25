package com.smartparking.exception;

/**
 * Thrown when an underlying JDBC, SQL or Connection pool operation fails.
 */
public class DatabaseException extends RuntimeException {
    public DatabaseException(String message) {
        super(message);
    }

    public DatabaseException(String message, Throwable cause) {
        super(message, cause);
    }
}
