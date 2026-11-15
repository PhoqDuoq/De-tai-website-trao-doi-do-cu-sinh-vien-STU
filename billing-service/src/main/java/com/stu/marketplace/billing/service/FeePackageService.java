package com.stu.marketplace.billing.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.billing.dto.FeePackageRequest;
import com.stu.marketplace.billing.dto.FeePackageResponse;
import com.stu.marketplace.billing.dto.PagedResponse;
import com.stu.marketplace.billing.entity.FeePackage;
import com.stu.marketplace.billing.repository.FeePackageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeePackageService {

    private final FeePackageRepository feePackageRepository;

    @Transactional(readOnly = true)
    public List<FeePackageResponse> getActivePackages() {
        return feePackageRepository.findByIsActiveTrue().stream()
                .map(FeePackageResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public FeePackageResponse getPackageById(Integer id) {
        FeePackage feePackage = feePackageRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.FEE_PACKAGE_NOT_FOUND, "Fee package not found with id: " + id));
        return FeePackageResponse.fromEntity(feePackage);
    }

    @Transactional(readOnly = true)
    public PagedResponse<FeePackageResponse> getAllPackages(Pageable pageable) {
        Page<FeePackage> page = feePackageRepository.findAll(pageable);
        return PagedResponse.from(page.map(FeePackageResponse::fromEntity));
    }

    @Transactional
    public FeePackageResponse createPackage(FeePackageRequest req) {
        String code = req.getPackageCode().trim().toUpperCase();
        if (feePackageRepository.existsByPackageCode(code)) {
            throw new AppException(ErrorCode.CONFLICT, "Fee package with code '" + code + "' already exists");
        }

        FeePackage feePackage = FeePackage.builder()
                .packageCode(code)
                .name(req.getName().trim())
                .description(req.getDescription())
                .price(req.getPrice())
                .durationDays(req.getDurationDays())
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                .build();

        FeePackage saved = feePackageRepository.save(feePackage);
        log.info("Created fee package: {} (id: {})", saved.getPackageCode(), saved.getId());
        return FeePackageResponse.fromEntity(saved);
    }

    @Transactional
    public FeePackageResponse updatePackage(Integer id, FeePackageRequest req) {
        FeePackage feePackage = feePackageRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.FEE_PACKAGE_NOT_FOUND, "Fee package not found with id: " + id));

        if (!feePackage.getPackageCode().equalsIgnoreCase(req.getPackageCode().trim())) {
            String newCode = req.getPackageCode().trim().toUpperCase();
            if (feePackageRepository.existsByPackageCode(newCode)) {
                throw new AppException(ErrorCode.CONFLICT, "Fee package with code '" + newCode + "' already exists");
            }
            feePackage.setPackageCode(newCode);
        }

        feePackage.setName(req.getName().trim());
        feePackage.setDescription(req.getDescription());
        feePackage.setPrice(req.getPrice());
        feePackage.setDurationDays(req.getDurationDays());
        if (req.getIsActive() != null) {
            feePackage.setIsActive(req.getIsActive());
        }

        FeePackage updated = feePackageRepository.save(feePackage);
        log.info("Updated fee package: {} (id: {})", updated.getPackageCode(), updated.getId());
        return FeePackageResponse.fromEntity(updated);
    }
}
