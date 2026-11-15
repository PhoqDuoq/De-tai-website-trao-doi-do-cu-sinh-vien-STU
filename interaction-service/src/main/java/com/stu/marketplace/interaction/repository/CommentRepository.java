package com.stu.marketplace.interaction.repository;

import com.stu.marketplace.interaction.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByListingIdAndParentIsNullOrderByCreatedAtAsc(Long listingId);

    Page<Comment> findByListingIdAndParentIsNullOrderByCreatedAtDesc(Long listingId, Pageable pageable);

    List<Comment> findByParentIdOrderByCreatedAtAsc(Long parentId);

    long countByListingId(Long listingId);
}
