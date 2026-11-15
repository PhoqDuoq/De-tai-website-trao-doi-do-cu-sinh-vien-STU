package com.stu.marketplace.billing.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.billing.dto.FeePackageRequest;
import com.stu.marketplace.billing.dto.FeePackageResponse;
import com.stu.marketplace.billing.dto.PagedResponse;
import com.stu.marketplace.billing.entity.FeePackage;
import com.stu.marketplace.billing.repository.FeePackageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FeePackageServiceTest {

    @Mock
    private FeePackageRepository feePackageRepository;

    @InjectMocks
    private FeePackageService feePackageService;

    private FeePackage boost3Days;

    @BeforeEach
    void setUp() {
        boost3Days = FeePackage.builder()
                .id(1)
                .packageCode("BOOST_3_DAYS")
                .name("3-Day Priority Boost")
                .description("Boosts listing to the top for 3 days")
                .price(new BigDecimal("15000.00"))
                .durationDays(3)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("getActivePackages returns only active packages")
    void getActivePackages_returnsActiveList() {
        when(feePackageRepository.findByIsActiveTrue()).thenReturn(List.of(boost3Days));

        List<FeePackageResponse> list = feePackageService.getActivePackages();

        assertThat(list).hasSize(1);
        assertThat(list.get(0).getPackageCode()).isEqualTo("BOOST_3_DAYS");
    }

    @Test
    @DisplayName("getPackageById returns package when found")
    void getPackageById_success() {
        when(feePackageRepository.findById(1)).thenReturn(Optional.of(boost3Days));

        FeePackageResponse response = feePackageService.getPackageById(1);

        assertThat(response.getId()).isEqualTo(1);
        assertThat(response.getName()).isEqualTo("3-Day Priority Boost");
    }

    @Test
    @DisplayName("getPackageById throws FEE_PACKAGE_NOT_FOUND when not found")
    void getPackageById_notFound_throwsException() {
        when(feePackageRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> feePackageService.getPackageById(99))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("not found");
    }

    @Test
    @DisplayName("createPackage saves new package successfully")
    void createPackage_success() {
        when(feePackageRepository.existsByPackageCode("VIP_7_DAYS")).thenReturn(false);
        when(feePackageRepository.save(any(FeePackage.class))).thenAnswer(invocation -> {
            FeePackage p = invocation.getArgument(0);
            p.setId(2);
            p.setCreatedAt(LocalDateTime.now());
            return p;
        });

        FeePackageRequest req = FeePackageRequest.builder()
                .packageCode("VIP_7_DAYS")
                .name("7-Day VIP Badge")
                .description("VIP Badge for 7 days")
                .price(new BigDecimal("30000.00"))
                .durationDays(7)
                .isActive(true)
                .build();

        FeePackageResponse response = feePackageService.createPackage(req);

        assertThat(response.getId()).isEqualTo(2);
        assertThat(response.getPackageCode()).isEqualTo("VIP_7_DAYS");
        verify(feePackageRepository).save(any(FeePackage.class));
    }

    @Test
    @DisplayName("createPackage throws conflict when package code already exists")
    void createPackage_duplicateCode_throwsException() {
        when(feePackageRepository.existsByPackageCode("BOOST_3_DAYS")).thenReturn(true);

        FeePackageRequest req = FeePackageRequest.builder()
                .packageCode("BOOST_3_DAYS")
                .name("Duplicate")
                .price(BigDecimal.TEN)
                .durationDays(3)
                .build();

        assertThatThrownBy(() -> feePackageService.createPackage(req))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("already exists");
    }
}
