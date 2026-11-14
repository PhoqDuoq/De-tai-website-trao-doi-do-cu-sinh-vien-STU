package com.stu.marketplace.listing.repository;

import com.stu.marketplace.listing.entity.ListingStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ListingStatusHistoryRepository extends JpaRepository<ListingStatusHistory, Long> {

    List<ListingStatusHistory> findByListingIdOrderByCreatedAtDesc(Long listingId);
}
