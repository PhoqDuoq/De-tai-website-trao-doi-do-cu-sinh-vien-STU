package com.stu.marketplace.listing.dto;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ListingDetailResponse extends ListingResponse {

    private List<ListingStatusHistoryDto> statusHistory;
}
