package com.stu.marketplace.transaction.constant;

import lombok.Getter;

import java.util.Arrays;
import java.util.List;

@Getter
public enum CampusLocation {
    HALL_A("Sảnh Nhà A", "Khu vực sảnh chính tòa nhà A - 180 Cao Lỗ"),
    HALL_C("Sảnh Nhà C", "Khu vực sảnh tòa nhà C (gần khu thực hành)"),
    LIBRARY("Thư viện STU", "Khu vực tự học trước cửa thư viện STU"),
    CANTEEN("Căn tin STU", "Khuôn viên căn tin sinh viên trường STU"),
    CAMPUS_YARD("Sân trường STU", "Khu vực ghế đá sân trường STU"),
    PARKING_LOT("Nhà xe sinh viên STU", "Khu vực cổng vào nhà xe sinh viên 180 Cao Lỗ");

    private final String name;
    private final String description;

    CampusLocation(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public static List<CampusLocation> getAll() {
        return Arrays.asList(values());
    }

    public static boolean isValidLocation(String location) {
        if (location == null || location.isBlank()) {
            return false;
        }
        String trimmed = location.trim();
        String normalized = trimmed.toLowerCase();
        for (CampusLocation loc : values()) {
            if (loc.name().equalsIgnoreCase(trimmed)
                    || loc.getName().equalsIgnoreCase(trimmed)
                    || normalized.contains(loc.name().toLowerCase())
                    || normalized.contains(loc.getName().toLowerCase())
                    || (loc == HALL_A && (normalized.contains("sanh toa nha a") || normalized.contains("sảnh tòa nhà a") || normalized.contains("sảnh nhà a") || normalized.contains("toa nha a") || normalized.contains("nhà a")))
                    || (loc == HALL_C && (normalized.contains("sanh toa nha c") || normalized.contains("sảnh tòa nhà c") || normalized.contains("sảnh nhà c") || normalized.contains("toa nha c") || normalized.contains("nhà c")))
                    || (loc == LIBRARY && (normalized.contains("thu vien") || normalized.contains("thư viện") || normalized.contains("library")))
                    || (loc == CANTEEN && (normalized.contains("can tin") || normalized.contains("căn tin") || normalized.contains("canteen")))
                    || (loc == CAMPUS_YARD && (normalized.contains("san truong") || normalized.contains("sân trường") || normalized.contains("campus yard")))
                    || (loc == PARKING_LOT && (normalized.contains("nha xe") || normalized.contains("nhà xe") || normalized.contains("parking")))) {
                return true;
            }
        }
        return false;
    }
}
