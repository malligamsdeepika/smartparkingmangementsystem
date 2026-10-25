package com.smartparking.util;

import at.favre.lib.crypto.bcrypt.BCrypt;

/**
 * Utility for hashing and verifying passwords securely using BCrypt with salt rounds = 10.
 */
public class PasswordUtil {

    private static final int BCRYPT_COST = 10;

    /**
     * Hashes a plaintext password using BCrypt.
     * @param plainPassword Raw password entered by user.
     * @return 60-character BCrypt hash string.
     */
    public static String hashPassword(String plainPassword) {
        if (plainPassword == null || plainPassword.trim().isEmpty()) {
            throw new IllegalArgumentException("Password cannot be empty");
        }
        return BCrypt.withDefaults().hashToString(BCRYPT_COST, plainPassword.toCharArray());
    }

    /**
     * Verifies a plaintext password against an existing BCrypt hash.
     * @param plainPassword Raw password provided during login.
     * @param hashedPassword Stored BCrypt hash from database.
     * @return true if matches, false otherwise.
     */
    public static boolean verifyPassword(String plainPassword, String hashedPassword) {
        if (plainPassword == null || hashedPassword == null) {
            return false;
        }
        BCrypt.Result result = BCrypt.verifyer().verify(plainPassword.toCharArray(), hashedPassword);
        return result.verified;
    }
}
