package com.stu.marketplace.billing.dto;

import com.stu.marketplace.billing.entity.FeePackage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeePackageResponse {

    private Integer id;
    private String packageCode;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer durationDays;
    private Boolean isActive;
    private LocalDateTime createdAt;

    public static FeePackageResponse fromEntity(FeePackage entity) {
        return FeePackageResponse.builder()
                .id(entity.getId())
                .packageCode(entity.getPackageCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .price(entity.getPrice())
                .durationDays(entity.getDurationDays())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
