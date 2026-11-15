package com.stu.marketplace.listing.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.listing.dto.*;
import com.stu.marketplace.listing.entity.*;
import com.stu.marketplace.listing.repository.CategoryRepository;
import com.stu.marketplace.listing.repository.ListingImageRepository;
import com.stu.marketplace.listing.repository.ListingRepository;
import com.stu.marketplace.listing.repository.ListingStatusHistoryRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ListingService {

    private final ListingRepository listingRepository;
    private final CategoryRepository categoryRepository;
    private final ListingImageRepository imageRepository;
    private final ListingStatusHistoryRepository historyRepository;
    private final CategoryService categoryService;

    @Transactional
    public ListingResponse createListing(Long sellerId, CreateListingRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        ListingStatus initialStatus = Boolean.TRUE.equals(request.getSubmitForReview())
                ? ListingStatus.PENDING_REVIEW
                : ListingStatus.DRAFT;

        Listing listing = Listing.builder()
                .sellerId(sellerId)
                .category(category)
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .price(request.getPrice())
                .itemCondition(request.getItemCondition())
                .conditionPercent(request.getConditionPercent() != null ? request.getConditionPercent().byteValue() : null)
                .status(initialStatus)
                .build();

        if (request.getImages() != null && !request.getImages().isEmpty()) {
            if (request.getImages().size() > 10) {
                throw new AppException(ErrorCode.MAX_IMAGES_EXCEEDED);
            }
            int order = 0;
            for (ListingImageDto imgDto : request.getImages()) {
                ListingImage img = ListingImage.builder()
                        .storageKey(imgDto.getStorageKey())
                        .mimeType(StringUtils.hasText(imgDto.getMimeType()) ? imgDto.getMimeType() : "image/jpeg")
                        .sortOrder(imgDto.getSortOrder() != null ? imgDto.getSortOrder().shortValue() : (short) order++)
                        .build();
                listing.addImage(img);
            }
        }

        listing = listingRepository.save(listing);

        historyRepository.save(ListingStatusHistory.builder()
                .listing(listing)
                .fromStatus(null)
                .toStatus(initialStatus.name())
                .actorId(sellerId)
                .reason("Listing created")
                .build());

        return mapToResponse(listing);
    }

    @Transactional
    public ListingResponse updateListing(Long listingId, Long currentUserId, UpdateListingRequest request) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new AppException(ErrorCode.LISTING_NOT_FOUND));

        if (!listing.getSellerId().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_LISTING_ACTION);
        }

        if (listing.getStatus() == ListingStatus.SOLD || listing.getStatus() == ListingStatus.REMOVED) {
            throw new AppException(ErrorCode.LISTING_STATUS_INVALID);
        }

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
            listing.setCategory(category);
        }

        if (StringUtils.hasText(request.getTitle())) {
            listing.setTitle(request.getTitle().trim());
        }
        if (StringUtils.hasText(request.getDescription())) {
            listing.setDescription(request.getDescription().trim());
        }
        if (request.getPrice() != null) {
            listing.setPrice(request.getPrice());
        }
        if (request.getItemCondition() != null) {
            listing.setItemCondition(request.getItemCondition());
        }
        if (request.getConditionPercent() != null) {
            listing.setConditionPercent(request.getConditionPercent().byteValue());
        }

        if (request.getImages() != null) {
            if (request.getImages().size() > 10) {
                throw new AppException(ErrorCode.MAX_IMAGES_EXCEEDED);
            }
            listing.getImages().clear();
            int order = 0;
            for (ListingImageDto imgDto : request.getImages()) {
                ListingImage img = ListingImage.builder()
                        .storageKey(imgDto.getStorageKey())
                        .mimeType(StringUtils.hasText(imgDto.getMimeType()) ? imgDto.getMimeType() : "image/jpeg")
                        .sortOrder(imgDto.getSortOrder() != null ? imgDto.getSortOrder().shortValue() : (short) order++)
                        .build();
                listing.addImage(img);
            }
        }

        boolean requiresModeration = listing.getStatus() == ListingStatus.PUBLISHED || listing.getStatus() == ListingStatus.HIDDEN;
        String previousStatus = listing.getStatus().name();
        if (requiresModeration) {
            listing.setStatus(ListingStatus.PENDING_REVIEW);
            listing.setPublishedAt(null);
        }

        listing = listingRepository.save(listing);

        if (requiresModeration) {
            historyRepository.save(ListingStatusHistory.builder()
                    .listing(listing)
                    .fromStatus(previousStatus)
                    .toStatus(ListingStatus.PENDING_REVIEW.name())
                    .actorId(currentUserId)
                    .reason("Listing updated by seller - submitted for re-moderation")
                    .build());
        }

        return mapToResponse(listing);
    }

    @Transactional
    public ListingResponse submitForReview(Long listingId, Long currentUserId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new AppException(ErrorCode.LISTING_NOT_FOUND));

        if (!listing.getSellerId().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_LISTING_ACTION);
        }

        if (listing.getStatus() != ListingStatus.DRAFT && listing.getStatus() != ListingStatus.REJECTED) {
            throw new AppException(ErrorCode.LISTING_STATUS_INVALID);
        }

        String previousStatus = listing.getStatus().name();
        listing.setStatus(ListingStatus.PENDING_REVIEW);
        listing = listingRepository.save(listing);

        historyRepository.save(ListingStatusHistory.builder()
                .listing(listing)
                .fromStatus(previousStatus)
                .toStatus(ListingStatus.PENDING_REVIEW.name())
                .actorId(currentUserId)
                .reason("Submitted for moderation review")
                .build());

        return mapToResponse(listing);
    }

    @Transactional
    public ListingResponse moderateListing(Long listingId, Long moderatorId, ListingStatusUpdateRequest request) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new AppException(ErrorCode.LISTING_NOT_FOUND));

        if (request.getStatus() != ListingStatus.PUBLISHED && request.getStatus() != ListingStatus.REJECTED) {
            throw new AppException(ErrorCode.LISTING_STATUS_INVALID);
        }

        String previousStatus = listing.getStatus().name();
        listing.setStatus(request.getStatus());
        if (request.getStatus() == ListingStatus.PUBLISHED) {
            listing.setPublishedAt(LocalDateTime.now());
        }
        listing = listingRepository.save(listing);

        historyRepository.save(ListingStatusHistory.builder()
                .listing(listing)
                .fromStatus(previousStatus)
                .toStatus(request.getStatus().name())
                .actorId(moderatorId)
                .reason(StringUtils.hasText(request.getReason()) ? request.getReason() : "Moderator decision")
                .build());

        return mapToResponse(listing);
    }

    @Transactional
    public ListingResponse updateSellerStatus(Long listingId, Long currentUserId, ListingStatusUpdateRequest request) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new AppException(ErrorCode.LISTING_NOT_FOUND));

        if (!listing.getSellerId().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_LISTING_ACTION);
        }

        // Allowed seller transitions:
        // 1. HIDDEN: Only allowed if current status is PUBLISHED.
        // 2. PUBLISHED (unhiding): Only allowed if current status is HIDDEN AND listing was previously approved by moderator (publishedAt != null).
        // 3. SOLD: Only allowed if current status is PUBLISHED or HIDDEN.
        // Direct transition to PUBLISHED without prior approval is rejected with LISTING_NOT_APPROVED.
        // All other illegal transitions reject with LISTING_STATUS_INVALID.
        if (request.getStatus() == ListingStatus.HIDDEN) {
            if (listing.getStatus() != ListingStatus.PUBLISHED) {
                throw new AppException(ErrorCode.LISTING_STATUS_INVALID);
            }
        } else if (request.getStatus() == ListingStatus.PUBLISHED) {
            if (listing.getStatus() != ListingStatus.HIDDEN) {
                throw new AppException(ErrorCode.LISTING_STATUS_INVALID);
            }
            if (listing.getPublishedAt() == null) {
                throw new AppException(ErrorCode.LISTING_NOT_APPROVED);
            }
        } else if (request.getStatus() == ListingStatus.SOLD) {
            if (listing.getStatus() != ListingStatus.PUBLISHED && listing.getStatus() != ListingStatus.HIDDEN) {
                throw new AppException(ErrorCode.LISTING_STATUS_INVALID);
            }
        } else {
            throw new AppException(ErrorCode.LISTING_STATUS_INVALID);
        }

        String previousStatus = listing.getStatus().name();
        listing.setStatus(request.getStatus());
        if (request.getStatus() == ListingStatus.SOLD) {
            listing.setSoldAt(LocalDateTime.now());
        }
        listing = listingRepository.save(listing);

        historyRepository.save(ListingStatusHistory.builder()
                .listing(listing)
                .fromStatus(previousStatus)
                .toStatus(request.getStatus().name())
                .actorId(currentUserId)
                .reason(StringUtils.hasText(request.getReason()) ? request.getReason() : "Seller status update")
                .build());

        return mapToResponse(listing);
    }

    @Transactional(readOnly = true)
    public ListingDetailResponse getListingById(Long listingId, Long currentUserId, boolean isModerator) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new AppException(ErrorCode.LISTING_NOT_FOUND));

        boolean isSeller = currentUserId != null && listing.getSellerId().equals(currentUserId);

        // If not published, only the seller or moderator/admin can view it
        if (listing.getStatus() != ListingStatus.PUBLISHED && !isSeller && !isModerator) {
            throw new AppException(ErrorCode.LISTING_NOT_FOUND);
        }

        ListingDetailResponse response = new ListingDetailResponse();
        copyProperties(mapToResponse(listing), response);

        if (isSeller || isModerator) {
            List<ListingStatusHistoryDto> history = historyRepository.findByListingIdOrderByCreatedAtDesc(listingId).stream()
                    .map(h -> ListingStatusHistoryDto.builder()
                            .id(h.getId())
                            .listingId(listingId)
                            .fromStatus(h.getFromStatus())
                            .toStatus(h.getToStatus())
                            .actorId(h.getActorId())
                            .reason(h.getReason())
                            .createdAt(h.getCreatedAt())
                            .build())
                    .toList();
            response.setStatusHistory(history);
        }

        return response;
    }

    @Transactional(readOnly = true)
    public PagedResponse<ListingResponse> searchListings(ListingFilterRequest filter) {
        return searchListings(filter, false);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ListingResponse> searchListings(ListingFilterRequest filter, boolean isStaff) {
        Sort.Direction direction = "ASC".equalsIgnoreCase(filter.getSortDir()) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String sortBy = StringUtils.hasText(filter.getSortBy()) ? filter.getSortBy() : "createdAt";
        Pageable pageable = PageRequest.of(Math.max(0, filter.getPage()), Math.max(1, filter.getSize()), Sort.by(direction, sortBy));

        Specification<Listing> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Public catalog search unconditionally enforces PUBLISHED status; client query status is completely ignored
            predicates.add(cb.equal(root.get("status"), ListingStatus.PUBLISHED));

            if (StringUtils.hasText(filter.getKeyword())) {
                String pattern = "%" + filter.getKeyword().trim().toLowerCase() + "%";
                Predicate titlePredicate = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descPredicate = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(titlePredicate, descPredicate));
            }

            if (filter.getCategoryId() != null) {
                predicates.add(cb.equal(root.get("category").get("id"), filter.getCategoryId()));
            }

            if (filter.getMinPrice() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), filter.getMinPrice()));
            }

            if (filter.getMaxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), filter.getMaxPrice()));
            }

            if (filter.getCondition() != null) {
                predicates.add(cb.equal(root.get("itemCondition"), filter.getCondition()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Listing> page = listingRepository.findAll(spec, pageable);
        List<ListingResponse> content = page.getContent().stream().map(this::mapToResponse).toList();

        return PagedResponse.<ListingResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public PagedResponse<ListingResponse> getMyListings(Long sellerId, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Listing> listingPage = listingRepository.findBySellerIdOrderByCreatedAtDesc(sellerId, pageable);

        List<ListingResponse> content = listingPage.getContent().stream().map(this::mapToResponse).toList();
        return PagedResponse.<ListingResponse>builder()
                .content(content)
                .page(listingPage.getNumber())
                .size(listingPage.getSize())
                .totalElements(listingPage.getTotalElements())
                .totalPages(listingPage.getTotalPages())
                .last(listingPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public PagedResponse<ListingResponse> getPendingListings(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Listing> listingPage = listingRepository.findByStatusOrderByCreatedAtDesc(ListingStatus.PENDING_REVIEW, pageable);

        List<ListingResponse> content = listingPage.getContent().stream().map(this::mapToResponse).toList();
        return PagedResponse.<ListingResponse>builder()
                .content(content)
                .page(listingPage.getNumber())
                .size(listingPage.getSize())
                .totalElements(listingPage.getTotalElements())
                .totalPages(listingPage.getTotalPages())
                .last(listingPage.isLast())
                .build();
    }

    @Transactional
    public ListingResponse boostListing(Long listingId, int durationDays) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new AppException(ErrorCode.LISTING_NOT_FOUND));

        listing.setUpdatedAt(LocalDateTime.now());
        listing = listingRepository.save(listing);

        historyRepository.save(ListingStatusHistory.builder()
                .listing(listing)
                .fromStatus(listing.getStatus().name())
                .toStatus(listing.getStatus().name())
                .actorId(listing.getSellerId())
                .reason("Listing priority boosted for " + durationDays + " days")
                .build());

        log.info("Listing {} successfully boosted for {} days", listingId, durationDays);
        return mapToResponse(listing);
    }

    @Transactional
    public ListingResponse syncListingSold(Long listingId, String reason) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new AppException(ErrorCode.LISTING_NOT_FOUND));

        String previousStatus = listing.getStatus().name();
        listing.setStatus(ListingStatus.SOLD);
        listing.setSoldAt(LocalDateTime.now());
        listing.setUpdatedAt(LocalDateTime.now());
        listing = listingRepository.save(listing);

        historyRepository.save(ListingStatusHistory.builder()
                .listing(listing)
                .fromStatus(previousStatus)
                .toStatus(ListingStatus.SOLD.name())
                .actorId(listing.getSellerId())
                .reason(StringUtils.hasText(reason) ? reason : "Sold via transaction handover")
                .build());

        log.info("Listing {} status synchronized to SOLD via internal sync (previous: {})", listingId, previousStatus);
        return mapToResponse(listing);
    }

    public ListingResponse mapToResponse(Listing listing) {
        List<ListingImageDto> images = listing.getImages().stream()
                .map(img -> ListingImageDto.builder()
                        .id(img.getId())
                        .storageKey(img.getStorageKey())
                        .mimeType(img.getMimeType())
                        .sortOrder(img.getSortOrder() != null ? img.getSortOrder().intValue() : 0)
                        .build())
                .toList();

        return ListingResponse.builder()
                .id(listing.getId())
                .sellerId(listing.getSellerId())
                .category(categoryService.mapToDto(listing.getCategory()))
                .title(listing.getTitle())
                .description(listing.getDescription())
                .price(listing.getPrice())
                .itemCondition(listing.getItemCondition())
                .conditionPercent(listing.getConditionPercent() != null ? listing.getConditionPercent().intValue() : null)
                .status(listing.getStatus())
                .publishedAt(listing.getPublishedAt())
                .soldAt(listing.getSoldAt())
                .createdAt(listing.getCreatedAt())
                .updatedAt(listing.getUpdatedAt())
                .images(images)
                .build();
    }

    private void copyProperties(ListingResponse source, ListingDetailResponse target) {
        target.setId(source.getId());
        target.setSellerId(source.getSellerId());
        target.setCategory(source.getCategory());
        target.setTitle(source.getTitle());
        target.setDescription(source.getDescription());
        target.setPrice(source.getPrice());
        target.setItemCondition(source.getItemCondition());
        target.setConditionPercent(source.getConditionPercent());
        target.setStatus(source.getStatus());
        target.setPublishedAt(source.getPublishedAt());
        target.setSoldAt(source.getSoldAt());
        target.setCreatedAt(source.getCreatedAt());
        target.setUpdatedAt(source.getUpdatedAt());
        target.setImages(source.getImages());
    }
}
