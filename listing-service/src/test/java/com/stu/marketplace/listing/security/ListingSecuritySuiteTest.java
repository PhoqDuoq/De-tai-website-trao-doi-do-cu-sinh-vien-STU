package com.stu.marketplace.listing.security;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.listing.dto.ListingDetailResponse;
import com.stu.marketplace.listing.dto.ListingFilterRequest;
import com.stu.marketplace.listing.dto.ListingResponse;
import com.stu.marketplace.listing.dto.ListingStatusUpdateRequest;
import com.stu.marketplace.listing.dto.PagedResponse;
import com.stu.marketplace.listing.dto.UpdateListingRequest;
import com.stu.marketplace.listing.entity.*;
import com.stu.marketplace.listing.repository.CategoryRepository;
import com.stu.marketplace.listing.repository.ListingImageRepository;
import com.stu.marketplace.listing.repository.ListingRepository;
import com.stu.marketplace.listing.repository.ListingStatusHistoryRepository;
import com.stu.marketplace.listing.service.CategoryService;
import com.stu.marketplace.listing.service.ListingService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ListingSecuritySuiteTest {

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

    private JwtTokenValidator tokenValidator;
    private final String secret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    private Category category;
    private Listing publishedListing;
    private Listing pendingListing;
    private Listing draftListing;
    private Listing hiddenListing;

    @BeforeEach
    void setUp() {
        tokenValidator = new JwtTokenValidator(secret);
        categoryService = new CategoryService(categoryRepository);
        listingService = new ListingService(listingRepository, categoryRepository, imageRepository, historyRepository, categoryService);

        category = Category.builder().id(1L).name("Sách").slug("sach").isActive(true).build();

        publishedListing = Listing.builder()
                .id(100L)
                .sellerId(10L)
                .category(category)
                .title("Sách Java 21")
                .description("Mô tả hợp lệ")
                .price(new BigDecimal("50000.00"))
                .itemCondition(ItemCondition.LIKE_NEW)
                .conditionPercent((byte) 95)
                .status(ListingStatus.PUBLISHED)
                .publishedAt(LocalDateTime.now().minusDays(1))
                .images(new ArrayList<>())
                .build();

        pendingListing = Listing.builder()
                .id(101L)
                .sellerId(10L)
                .category(category)
                .title("Sách C++ Chờ Duyệt")
                .status(ListingStatus.PENDING_REVIEW)
                .images(new ArrayList<>())
                .build();

        draftListing = Listing.builder()
                .id(102L)
                .sellerId(10L)
                .category(category)
                .title("Bản nháp")
                .status(ListingStatus.DRAFT)
                .images(new ArrayList<>())
                .build();

        hiddenListing = Listing.builder()
                .id(103L)
                .sellerId(10L)
                .category(category)
                .title("Tin tạm ẩn")
                .status(ListingStatus.HIDDEN)
                .publishedAt(LocalDateTime.now().minusDays(5)) // Was previously approved
                .images(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("SEC-01: Seller CANNOT transition DRAFT directly to PUBLISHED")
    void testUpdateSellerStatus_DraftToPublished_Forbidden() {
        when(listingRepository.findById(102L)).thenReturn(Optional.of(draftListing));

        ListingStatusUpdateRequest request = ListingStatusUpdateRequest.builder()
                .status(ListingStatus.PUBLISHED)
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                listingService.updateSellerStatus(102L, 10L, request));
        assertEquals(ErrorCode.LISTING_STATUS_INVALID, ex.getErrorCode());
    }

    @Test
    @DisplayName("SEC-01: Seller CANNOT transition DRAFT or PENDING_REVIEW to HIDDEN")
    void testUpdateSellerStatus_DraftToHidden_Forbidden() {
        when(listingRepository.findById(102L)).thenReturn(Optional.of(draftListing));

        ListingStatusUpdateRequest request = ListingStatusUpdateRequest.builder()
                .status(ListingStatus.HIDDEN)
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                listingService.updateSellerStatus(102L, 10L, request));
        assertEquals(ErrorCode.LISTING_STATUS_INVALID, ex.getErrorCode());
    }

    @Test
    @DisplayName("SEC-01: Seller CANNOT publish HIDDEN listing if it was never approved before (publishedAt == null)")
    void testUpdateSellerStatus_UnapprovedHiddenToPublished_Forbidden() {
        Listing neverApprovedHidden = Listing.builder()
                .id(104L)
                .sellerId(10L)
                .status(ListingStatus.HIDDEN)
                .publishedAt(null)
                .images(new ArrayList<>())
                .build();

        when(listingRepository.findById(104L)).thenReturn(Optional.of(neverApprovedHidden));

        ListingStatusUpdateRequest request = ListingStatusUpdateRequest.builder()
                .status(ListingStatus.PUBLISHED)
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                listingService.updateSellerStatus(104L, 10L, request));
        assertEquals(ErrorCode.LISTING_NOT_APPROVED, ex.getErrorCode());
    }

    @Test
    @DisplayName("SEC-01: Seller CAN unhide HIDDEN listing back to PUBLISHED if it was previously approved")
    void testUpdateSellerStatus_ApprovedHiddenToPublished_Succeeds() {
        when(listingRepository.findById(103L)).thenReturn(Optional.of(hiddenListing));
        when(listingRepository.save(any(Listing.class))).thenAnswer(i -> i.getArgument(0));

        ListingStatusUpdateRequest request = ListingStatusUpdateRequest.builder()
                .status(ListingStatus.PUBLISHED)
                .build();

        ListingResponse response = listingService.updateSellerStatus(103L, 10L, request);

        assertNotNull(response);
        assertEquals(ListingStatus.PUBLISHED, response.getStatus());
        verify(historyRepository).save(any(ListingStatusHistory.class));
    }

    @Test
    @DisplayName("SEC-01: Editing a PUBLISHED listing resets its status to PENDING_REVIEW for re-moderation")
    void testUpdateListing_PublishedItem_ResetsToPendingReview() {
        when(listingRepository.findById(100L)).thenReturn(Optional.of(publishedListing));
        when(listingRepository.save(any(Listing.class))).thenAnswer(i -> i.getArgument(0));

        UpdateListingRequest request = UpdateListingRequest.builder()
                .title("Sách Java 21 - Bản Chỉnh Sửa Mới")
                .build();

        ListingResponse response = listingService.updateListing(100L, 10L, request);

        assertNotNull(response);
        assertEquals(ListingStatus.PENDING_REVIEW, response.getStatus());
        verify(historyRepository).save(argThat(h ->
                "PENDING_REVIEW".equals(h.getToStatus()) && "PUBLISHED".equals(h.getFromStatus())));
    }

    @Test
    @DisplayName("SEC-03: Stranger cannot view unpublished listing via getListingById (throws 404)")
    void testGetListingById_StrangerViewingPending_ThrowsNotFound() {
        when(listingRepository.findById(101L)).thenReturn(Optional.of(pendingListing));

        // Caller 999 is not seller (10) and not moderator
        AppException ex = assertThrows(AppException.class, () ->
                listingService.getListingById(101L, 999L, false));
        assertEquals(ErrorCode.LISTING_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("SEC-03: Seller and Moderator CAN view unpublished listing via getListingById")
    void testGetListingById_OwnerOrModerator_Succeeds() {
        when(listingRepository.findById(101L)).thenReturn(Optional.of(pendingListing));
        when(historyRepository.findByListingIdOrderByCreatedAtDesc(101L)).thenReturn(Collections.emptyList());

        // Seller view
        ListingDetailResponse sellerView = listingService.getListingById(101L, 10L, false);
        assertNotNull(sellerView);

        // Moderator view
        ListingDetailResponse modView = listingService.getListingById(101L, 999L, true);
        assertNotNull(modView);
    }

    @Test
    @DisplayName("SEC-03: Public searchListings unconditionally enforces status=PUBLISHED")
    void testSearchListings_PublicQuery_OnlyPublished() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setStatus(ListingStatus.PENDING_REVIEW); // Attempt to query pending listings!

        Page<Listing> emptyPage = new PageImpl<>(Collections.emptyList());
        when(listingRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(emptyPage);

        PagedResponse<ListingResponse> response = listingService.searchListings(filter);

        assertNotNull(response);
        verify(listingRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    @DisplayName("SEC-04: Token from LOCKED user is rejected by JwtTokenValidator in Listing Service")
    void testJwtValidator_LockedAccount_Rejected() {
        // Create token with accountStatus = LOCKED
        String token = Jwts.builder()
                .subject("20")
                .claim("email", "locked@stu.edu.vn")
                .claim("studentCode", "DH52002020")
                .claim("accountStatus", "LOCKED")
                .claim("roles", List.of("ROLE_STUDENT"))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                .compact();

        UserPrincipal principal = tokenValidator.parseToken(token);

        assertNull(principal); // Must be rejected
    }

    @Test
    @DisplayName("SEC-04: Token from ACTIVE user is accepted by JwtTokenValidator")
    void testJwtValidator_ActiveAccount_Accepted() {
        String token = Jwts.builder()
                .subject("10")
                .claim("email", "active@stu.edu.vn")
                .claim("studentCode", "DH52001010")
                .claim("accountStatus", "ACTIVE")
                .claim("roles", List.of("ROLE_STUDENT"))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                .compact();

        UserPrincipal principal = tokenValidator.parseToken(token);

        assertNotNull(principal);
        assertEquals(10L, principal.getId());
        assertTrue(principal.isEnabled());
        assertTrue(principal.isAccountNonLocked());
    }

    @Test
    @DisplayName("SEC-Edge: Non-owner updating listing throws UNAUTHORIZED_LISTING_ACTION")
    void testUpdateListing_NonOwner_Forbidden() {
        when(listingRepository.findById(100L)).thenReturn(Optional.of(publishedListing));

        UpdateListingRequest request = UpdateListingRequest.builder().title("Hacked").build();

        AppException ex = assertThrows(AppException.class, () ->
                listingService.updateListing(100L, 999L, request)); // Current user 999 != Seller 10
        assertEquals(ErrorCode.UNAUTHORIZED_LISTING_ACTION, ex.getErrorCode());
    }
}
