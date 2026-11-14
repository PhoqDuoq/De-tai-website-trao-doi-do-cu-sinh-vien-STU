package com.stu.marketplace.listing.repository;

import com.stu.marketplace.listing.entity.Listing;
import com.stu.marketplace.listing.entity.ListingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ListingRepository extends JpaRepository<Listing, Long>, JpaSpecificationExecutor<Listing> {

    Page<Listing> findBySellerIdOrderByCreatedAtDesc(Long sellerId, Pageable pageable);

    Page<Listing> findByStatusOrderByCreatedAtDesc(ListingStatus status, Pageable pageable);

    Optional<Listing> findByIdAndSellerId(Long id, Long sellerId);
}
