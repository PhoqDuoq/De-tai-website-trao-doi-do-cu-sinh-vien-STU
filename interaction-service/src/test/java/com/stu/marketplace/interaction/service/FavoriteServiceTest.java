package com.stu.marketplace.interaction.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.interaction.dto.*;
import com.stu.marketplace.interaction.entity.Favorite;
import com.stu.marketplace.interaction.repository.FavoriteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FavoriteServiceTest {

    @Mock
    private FavoriteRepository favoriteRepository;

    @InjectMocks
    private FavoriteService favoriteService;

    private Favorite sampleFavorite;

    @BeforeEach
    void setUp() {
        sampleFavorite = Favorite.builder()
                .id(1L)
                .userId(10L)
                .listingId(100L)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("addFavorite should persist favorite when not already favorited")
    void testAddFavorite_Success() {
        when(favoriteRepository.existsByUserIdAndListingId(10L, 100L)).thenReturn(false);
        when(favoriteRepository.save(any(Favorite.class))).thenReturn(sampleFavorite);

        FavoriteResponse response = favoriteService.addFavorite(10L, new FavoriteRequest(100L));

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getUserId()).isEqualTo(10L);
        assertThat(response.getListingId()).isEqualTo(100L);
        verify(favoriteRepository).save(any(Favorite.class));
    }

    @Test
    @DisplayName("addFavorite should throw FAVORITE_ALREADY_EXISTS when already favorited")
    void testAddFavorite_DuplicateThrowsConflict() {
        when(favoriteRepository.existsByUserIdAndListingId(10L, 100L)).thenReturn(true);

        assertThatThrownBy(() -> favoriteService.addFavorite(10L, new FavoriteRequest(100L)))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FAVORITE_ALREADY_EXISTS);

        verify(favoriteRepository, never()).save(any(Favorite.class));
    }

    @Test
    @DisplayName("removeFavorite should delete favorite when exists")
    void testRemoveFavorite_Success() {
        when(favoriteRepository.findByUserIdAndListingId(10L, 100L)).thenReturn(Optional.of(sampleFavorite));

        favoriteService.removeFavorite(10L, 100L);

        verify(favoriteRepository).delete(sampleFavorite);
    }

    @Test
    @DisplayName("removeFavorite should throw FAVORITE_NOT_FOUND when not found")
    void testRemoveFavorite_NotFound_ThrowsException() {
        when(favoriteRepository.findByUserIdAndListingId(10L, 100L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> favoriteService.removeFavorite(10L, 100L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FAVORITE_NOT_FOUND);

        verify(favoriteRepository, never()).delete(any());
    }

    @Test
    @DisplayName("toggleFavorite should delete existing and return favorited=false")
    void testToggleFavorite_WhenExists_DeletesFavorite() {
        when(favoriteRepository.findByUserIdAndListingId(10L, 100L)).thenReturn(Optional.of(sampleFavorite));

        FavoriteToggleResponse response = favoriteService.toggleFavorite(10L, 100L);

        assertThat(response.isFavorited()).isFalse();
        assertThat(response.getListingId()).isEqualTo(100L);
        verify(favoriteRepository).delete(sampleFavorite);
    }

    @Test
    @DisplayName("toggleFavorite should create new and return favorited=true when not existing")
    void testToggleFavorite_WhenNotExists_CreatesFavorite() {
        when(favoriteRepository.findByUserIdAndListingId(10L, 100L)).thenReturn(Optional.empty());
        when(favoriteRepository.save(any(Favorite.class))).thenReturn(sampleFavorite);

        FavoriteToggleResponse response = favoriteService.toggleFavorite(10L, 100L);

        assertThat(response.isFavorited()).isTrue();
        assertThat(response.getListingId()).isEqualTo(100L);
        verify(favoriteRepository).save(any(Favorite.class));
    }

    @Test
    @DisplayName("isFavorited should return repository result")
    void testIsFavorited() {
        when(favoriteRepository.existsByUserIdAndListingId(10L, 100L)).thenReturn(true);

        boolean result = favoriteService.isFavorited(10L, 100L);

        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("getMyFavorites should return paginated favorites")
    void testGetMyFavorites() {
        Page<Favorite> page = new PageImpl<>(List.of(sampleFavorite), PageRequest.of(0, 10), 1);
        when(favoriteRepository.findByUserIdOrderByCreatedAtDesc(eq(10L), any())).thenReturn(page);

        PagedResponse<FavoriteResponse> response = favoriteService.getMyFavorites(10L, 0, 10);

        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getTotalElements()).isEqualTo(1);
        assertThat(response.getContent().get(0).getListingId()).isEqualTo(100L);
    }

    @Test
    @DisplayName("getFavoriteCount should return total count for listing")
    void testGetFavoriteCount() {
        when(favoriteRepository.countByListingId(100L)).thenReturn(5L);

        FavoriteCountResponse response = favoriteService.getFavoriteCount(100L);

        assertThat(response.getListingId()).isEqualTo(100L);
        assertThat(response.getCount()).isEqualTo(5L);
    }
}
