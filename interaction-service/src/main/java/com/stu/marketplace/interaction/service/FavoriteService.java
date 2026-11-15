package com.stu.marketplace.interaction.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.interaction.dto.*;
import com.stu.marketplace.interaction.entity.Favorite;
import com.stu.marketplace.interaction.repository.FavoriteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;

    @Transactional
    public FavoriteResponse addFavorite(Long userId, FavoriteRequest request) {
        if (favoriteRepository.existsByUserIdAndListingId(userId, request.getListingId())) {
            throw new AppException(ErrorCode.FAVORITE_ALREADY_EXISTS);
        }

        Favorite favorite = Favorite.builder()
                .userId(userId)
                .listingId(request.getListingId())
                .build();

        Favorite saved = favoriteRepository.save(favorite);
        log.info("User {} added listing {} to favorites", userId, request.getListingId());
        return mapToResponse(saved);
    }

    @Transactional
    public void removeFavorite(Long userId, Long listingId) {
        Favorite favorite = favoriteRepository.findByUserIdAndListingId(userId, listingId)
                .orElseThrow(() -> new AppException(ErrorCode.FAVORITE_NOT_FOUND));

        favoriteRepository.delete(favorite);
        log.info("User {} removed listing {} from favorites", userId, listingId);
    }

    @Transactional
    public FavoriteToggleResponse toggleFavorite(Long userId, Long listingId) {
        return favoriteRepository.findByUserIdAndListingId(userId, listingId)
                .map(existing -> {
                    favoriteRepository.delete(existing);
                    log.info("Toggled OFF favorite for user {} on listing {}", userId, listingId);
                    return FavoriteToggleResponse.builder()
                            .listingId(listingId)
                            .favorited(false)
                            .message("Listing removed from favorites")
                            .build();
                })
                .orElseGet(() -> {
                    Favorite favorite = Favorite.builder()
                            .userId(userId)
                            .listingId(listingId)
                            .build();
                    favoriteRepository.save(favorite);
                    log.info("Toggled ON favorite for user {} on listing {}", userId, listingId);
                    return FavoriteToggleResponse.builder()
                            .listingId(listingId)
                            .favorited(true)
                            .message("Listing added to favorites")
                            .build();
                });
    }

    @Transactional(readOnly = true)
    public boolean isFavorited(Long userId, Long listingId) {
        return favoriteRepository.existsByUserIdAndListingId(userId, listingId);
    }

    @Transactional(readOnly = true)
    public PagedResponse<FavoriteResponse> getMyFavorites(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Favorite> favoritePage = favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        List<FavoriteResponse> content = favoritePage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PagedResponse.<FavoriteResponse>builder()
                .content(content)
                .page(favoritePage.getNumber())
                .size(favoritePage.getSize())
                .totalElements(favoritePage.getTotalElements())
                .totalPages(favoritePage.getTotalPages())
                .last(favoritePage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public FavoriteCountResponse getFavoriteCount(Long listingId) {
        long count = favoriteRepository.countByListingId(listingId);
        return FavoriteCountResponse.builder()
                .listingId(listingId)
                .count(count)
                .build();
    }

    private FavoriteResponse mapToResponse(Favorite favorite) {
        return FavoriteResponse.builder()
                .id(favorite.getId())
                .userId(favorite.getUserId())
                .listingId(favorite.getListingId())
                .createdAt(favorite.getCreatedAt())
                .build();
    }
}
