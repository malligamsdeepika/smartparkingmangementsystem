package com.smartparking.util;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Date and time operations for calculating parking durations, overstays, and peak hours.
 */
public class DateTimeUtil {

    public static final DateTimeFormatter STANDARD_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    public static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");

    public static LocalDateTime parse(String dateTimeStr) {
        if (dateTimeStr == null || dateTimeStr.trim().isEmpty()) {
            return null;
        }
        dateTimeStr = dateTimeStr.trim();
        if (dateTimeStr.contains("T")) {
            return LocalDateTime.parse(dateTimeStr.substring(0, Math.min(dateTimeStr.length(), 16)), ISO_FORMATTER);
        }
        return LocalDateTime.parse(dateTimeStr, STANDARD_FORMATTER);
    }

    public static String format(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.format(STANDARD_FORMATTER) : "";
    }

    /**
     * Calculates duration in hours between two timestamps, rounded up to the nearest hour.
     */
    public static long calculateDurationHours(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) return 1;
        long minutes = Duration.between(start, end).toMinutes();
        if (minutes <= 0) return 1;
        return (long) Math.ceil((double) minutes / 60.0);
    }

    /**
     * Calculates overstay in minutes. If actualExit <= scheduledEnd, returns 0.
     */
    public static long calculateOverstayMinutes(LocalDateTime scheduledEnd, LocalDateTime actualExit) {
        if (scheduledEnd == null || actualExit == null) return 0;
        long diff = Duration.between(scheduledEnd, actualExit).toMinutes();
        return Math.max(0, diff);
    }

    /**
     * Checks whether the given timestamp falls into peak hours (e.g., 09:00 - 12:00 or 17:00 - 20:00).
     */
    public static boolean isPeakHour(LocalDateTime time) {
        if (time == null) return false;
        int hour = time.getHour();
        return (hour >= 9 && hour <= 12) || (hour >= 17 && hour <= 20);
    }

    /**
     * Checks whether the given date is on a weekend (Saturday or Sunday).
     */
    public static boolean isWeekend(LocalDateTime time) {
        if (time == null) return false;
        java.time.DayOfWeek day = time.getDayOfWeek();
        return day == java.time.DayOfWeek.SATURDAY || day == java.time.DayOfWeek.SUNDAY;
    }
}
