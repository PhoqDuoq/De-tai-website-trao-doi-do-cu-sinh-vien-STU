package com.stu.marketplace.interaction.repository;

import com.stu.marketplace.interaction.entity.Favorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    Optional<Favorite> findByUserIdAndListingId(Long userId, Long listingId);

    boolean existsByUserIdAndListingId(Long userId, Long listingId);

    void deleteByUserIdAndListingId(Long userId, Long listingId);

    Page<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByListingId(Long listingId);
}
