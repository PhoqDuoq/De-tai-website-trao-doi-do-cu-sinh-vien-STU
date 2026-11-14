package com.stu.marketplace.listing.repository;

import com.stu.marketplace.listing.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByIsActiveTrueOrderByParentIdAscNameAsc();

    Optional<Category> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
