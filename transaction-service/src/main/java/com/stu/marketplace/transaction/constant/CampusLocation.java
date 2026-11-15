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
}
