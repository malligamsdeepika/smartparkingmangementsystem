package com.smartparking.util;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * Utility for generating standardized QR code payloads and Base64 PNG images for parking entry/exit.
 */
public class QRCodeUtil {

    private static final int DEFAULT_WIDTH = 250;
    private static final int DEFAULT_HEIGHT = 250;

    /**
     * Constructs a structured JSON or delimited payload encoded into the QR.
     */
    public static String generatePayload(String bookingReference, String slotNumber, int userId, String startTime, String endTime) {
        Map<String, Object> qrData = new HashMap<>();
        qrData.put("bookingRef", bookingReference);
        qrData.put("slot", slotNumber);
        qrData.put("userId", userId);
        qrData.put("start", startTime);
        qrData.put("end", endTime);
        return JsonUtil.toJson(qrData);
    }

    /**
     * Converts a text payload into a Base64-encoded Data URL for rendering in web browsers.
     * @param payload Text data to embed in QR code.
     * @return Base64 data URL: "data:image/png;base64,..."
     */
    public static String generateQRCodeBase64(String payload) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(payload, BarcodeFormat.QR_CODE, DEFAULT_WIDTH, DEFAULT_HEIGHT);
            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            byte[] pngData = pngOutputStream.toByteArray();
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(pngData);
        } catch (Exception e) {
            return "";
        }
    }
}
