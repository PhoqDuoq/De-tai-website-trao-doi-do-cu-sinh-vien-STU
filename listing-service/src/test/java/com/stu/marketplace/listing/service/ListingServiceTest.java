package com.stu.marketplace.listing.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.listing.dto.*;
import com.stu.marketplace.listing.entity.*;
import com.stu.marketplace.listing.repository.CategoryRepository;
import com.stu.marketplace.listing.repository.ListingImageRepository;
import com.stu.marketplace.listing.repository.ListingRepository;
import com.stu.marketplace.listing.repository.ListingStatusHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ListingServiceTest {

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ListingImageRepository imageRepository;

    @Mock
    private ListingStatusHistoryRepository historyRepository;

    private CategoryService categoryService;
    private ListingService listingService;

    private Category sampleCategory;
    private Listing sampleListing;

    @BeforeEach
    void setUp() {
        categoryService = new CategoryService(categoryRepository);
        listingService = new ListingService(listingRepository, categoryRepository, imageRepository, historyRepository, categoryService);

        sampleCategory = Category.builder()
                .id(1L)
                .name("Giáo trình & Tài liệu")
                .slug("giao-trinh-tai-lieu")
                .isActive(true)
                .build();

        sampleListing = Listing.builder()
                .id(100L)
                .sellerId(10L)
                .category(sampleCategory)
                .title("Giáo trình Cấu trúc dữ liệu")
                .description("Sách dùng tốt cho sinh viên CNTT STU")
                .price(new BigDecimal("50000.00"))
                .itemCondition(ItemCondition.USED)
                .conditionPercent((byte) 90)
                .status(ListingStatus.DRAFT)
                .images(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should create listing as DRAFT when submitForReview is false")
    void testCreateListing_Draft() {
        CreateListingRequest request = CreateListingRequest.builder()
                .categoryId(1L)
                .title("Giáo trình Cấu trúc dữ liệu")
                .description("Sách dùng tốt cho sinh viên CNTT STU")
                .price(new BigDecimal("50000.00"))
                .itemCondition(ItemCondition.USED)
                .conditionPercent(90)
                .submitForReview(false)
                .build();

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(listingRepository.save(any(Listing.class))).thenReturn(sampleListing);

        ListingResponse response = listingService.createListing(10L, request);

        assertNotNull(response);
        assertEquals(ListingStatus.DRAFT, response.getStatus());
        assertEquals("Giáo trình Cấu trúc dữ liệu", response.getTitle());
        verify(listingRepository).save(any(Listing.class));
        verify(historyRepository).save(any(ListingStatusHistory.class));
    }

    @Test
    @DisplayName("Should throw UNAUTHORIZED_LISTING_ACTION when updating another seller's listing")
    void testUpdateListing_Unauthorized() {
        UpdateListingRequest request = UpdateListingRequest.builder()
                .title("Updated Title")
                .build();

        when(listingRepository.findById(100L)).thenReturn(Optional.of(sampleListing));

        AppException ex = assertThrows(AppException.class, () ->
                listingService.updateListing(100L, 999L, request)); // Current user 999 != Seller 10

        assertEquals(ErrorCode.UNAUTHORIZED_LISTING_ACTION, ex.getErrorCode());
        verify(listingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should submit DRAFT listing for review")
    void testSubmitForReview_Success() {
        when(listingRepository.findById(100L)).thenReturn(Optional.of(sampleListing));
        when(listingRepository.save(any(Listing.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ListingResponse response = listingService.submitForReview(100L, 10L);

        assertNotNull(response);
        assertEquals(ListingStatus.PENDING_REVIEW, response.getStatus());
        verify(historyRepository).save(any(ListingStatusHistory.class));
    }

    @Test
    @DisplayName("Seller cannot directly transition listing status to PUBLISHED")
    void testUpdateSellerStatus_CannotPublishDirectly() {
        ListingStatusUpdateRequest request = ListingStatusUpdateRequest.builder()
                .status(ListingStatus.PUBLISHED)
                .build();

        when(listingRepository.findById(100L)).thenReturn(Optional.of(sampleListing));

        AppException ex = assertThrows(AppException.class, () ->
                listingService.updateSellerStatus(100L, 10L, request));

        assertEquals(ErrorCode.LISTING_STATUS_INVALID, ex.getErrorCode());
    }

    @Test
    @DisplayName("Moderator can approve PENDING_REVIEW listing to PUBLISHED")
    void testModerateListing_Approve() {
        sampleListing.setStatus(ListingStatus.PENDING_REVIEW);

        ListingStatusUpdateRequest request = ListingStatusUpdateRequest.builder()
                .status(ListingStatus.PUBLISHED)
                .reason("Listing satisfies community guidelines")
                .build();

        when(listingRepository.findById(100L)).thenReturn(Optional.of(sampleListing));
        when(listingRepository.save(any(Listing.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ListingResponse response = listingService.moderateListing(100L, 999L, request); // Moderator 999

        assertNotNull(response);
        assertEquals(ListingStatus.PUBLISHED, response.getStatus());
        assertNotNull(response.getPublishedAt());
        verify(historyRepository).save(any(ListingStatusHistory.class));
    }
}
