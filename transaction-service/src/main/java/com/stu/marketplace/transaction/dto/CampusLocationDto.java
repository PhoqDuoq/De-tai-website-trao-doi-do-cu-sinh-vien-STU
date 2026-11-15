package com.stu.marketplace.transaction.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampusLocationDto {

    private String code;
    private String name;
    private String description;
}
