package com.stu.marketplace.transaction.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeetupScheduleRequest {

    @NotBlank(message = "Meeting location is required")
    private String meetingLocation;

    @NotNull(message = "Meeting time is required")
    @Future(message = "Meeting time must be in the future")
    private LocalDateTime meetingTime;

    private String note;
}
