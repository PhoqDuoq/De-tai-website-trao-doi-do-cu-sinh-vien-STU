package com.stu.marketplace.identity.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.identity.dto.request.StudentVerificationRequest;
import com.stu.marketplace.identity.dto.request.VerificationReviewRequest;
import com.stu.marketplace.identity.dto.response.StudentVerificationResponse;
import com.stu.marketplace.identity.entity.*;
import com.stu.marketplace.identity.repository.StudentVerificationRepository;
import com.stu.marketplace.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentVerificationService {

    private final StudentVerificationRepository verificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public StudentVerificationResponse submitVerification(Long userId, StudentVerificationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.getVerificationStatus() == VerificationStatus.VERIFIED) {
            throw new AppException(ErrorCode.VERIFICATION_ALREADY_SUBMITTED);
        }

        if (verificationRepository.existsByUserIdAndStatus(userId, StudentVerificationStatus.PENDING)) {
            throw new AppException(ErrorCode.VERIFICATION_ALREADY_SUBMITTED);
        }

        if (StringUtils.hasText(request.getStudentCode())) {
            String studentCode = request.getStudentCode().trim().toUpperCase();
            if (userRepository.existsByStudentCode(studentCode) && !studentCode.equalsIgnoreCase(user.getStudentCode())) {
                throw new AppException(ErrorCode.STUDENT_CODE_ALREADY_EXISTS);
            }
            user.setStudentCode(studentCode);
            userRepository.save(user);
        }

        StudentVerification verification = StudentVerification.builder()
                .user(user)
                .method(request.getMethod())
                .evidenceReference(request.getEvidenceReference().trim())
                .status(StudentVerificationStatus.PENDING)
                .build();

        verification = verificationRepository.save(verification);
        return mapToResponse(verification);
    }

    @Transactional(readOnly = true)
    public List<StudentVerificationResponse> getUserVerifications(Long userId) {
        return verificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentVerificationResponse> getPendingVerifications() {
        return verificationRepository.findByStatusOrderByCreatedAtAsc(StudentVerificationStatus.PENDING).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public StudentVerificationResponse reviewVerification(Long verificationId, Long reviewerId, VerificationReviewRequest request) {
        StudentVerification verification = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new AppException(ErrorCode.VERIFICATION_NOT_FOUND));

        verification.setStatus(request.getStatus());
        verification.setReviewedBy(reviewerId);
        verification.setReviewedAt(LocalDateTime.now());

        User user = verification.getUser();
        if (request.getStatus() == StudentVerificationStatus.APPROVED) {
            user.setVerificationStatus(VerificationStatus.VERIFIED);
            user.setVerifiedAt(LocalDateTime.now());
        } else if (request.getStatus() == StudentVerificationStatus.REJECTED) {
            user.setVerificationStatus(VerificationStatus.REJECTED);
        }
        userRepository.save(user);

        verification = verificationRepository.save(verification);
        return mapToResponse(verification);
    }

    private StudentVerificationResponse mapToResponse(StudentVerification v) {
        return StudentVerificationResponse.builder()
                .id(v.getId())
                .userId(v.getUser().getId())
                .userEmail(v.getUser().getEmail())
                .studentCode(v.getUser().getStudentCode())
                .method(v.getMethod())
                .evidenceReference(v.getEvidenceReference())
                .status(v.getStatus())
                .reviewedBy(v.getReviewedBy())
                .reviewedAt(v.getReviewedAt())
                .createdAt(v.getCreatedAt())
                .build();
    }
}
