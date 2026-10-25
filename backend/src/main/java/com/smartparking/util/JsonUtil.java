package com.smartparking.util;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonPrimitive;
import com.google.gson.JsonSerializer;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Utility for JSON serialization/deserialization using Google Gson.
 * Custom adapters for Java 8+ LocalDateTime ISO-8601 formatting.
 */
public class JsonUtil {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private static final Gson gson = new GsonBuilder()
            .registerTypeAdapter(LocalDateTime.class, (JsonSerializer<LocalDateTime>) (src, typeOfSrc, context) ->
                    new JsonPrimitive(src.format(FORMATTER)))
            .registerTypeAdapter(LocalDateTime.class, (JsonDeserializer<LocalDateTime>) (json, typeOfT, context) -> {
                String str = json.getAsString();
                if (str == null || str.trim().isEmpty()) return null;
                // Handle both ISO formatted (with T) and space-separated strings
                if (str.contains(" ") && !str.contains("T")) {
                    str = str.replace(" ", "T");
                }
                return LocalDateTime.parse(str.substring(0, Math.min(str.length(), 19)), FORMATTER);
            })
            .setPrettyPrinting()
            .create();

    public static Gson getGson() {
        return gson;
    }

    public static String toJson(Object obj) {
        return gson.toJson(obj);
    }

    public static <T> T fromJson(String json, Class<T> classOfT) {
        return gson.fromJson(json, classOfT);
    }
}
