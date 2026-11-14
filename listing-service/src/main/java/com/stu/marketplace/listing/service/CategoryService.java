package com.stu.marketplace.listing.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.listing.dto.CategoryDto;
import com.stu.marketplace.listing.dto.CreateCategoryRequest;
import com.stu.marketplace.listing.entity.Category;
import com.stu.marketplace.listing.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryDto> getAllActiveCategories() {
        return categoryRepository.findByIsActiveTrueOrderByParentIdAscNameAsc().stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoryDto getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        return mapToDto(category);
    }

    @Transactional
    public CategoryDto createCategory(CreateCategoryRequest request) {
        if (categoryRepository.existsBySlug(request.getSlug().trim().toLowerCase())) {
            throw new AppException(ErrorCode.CATEGORY_SLUG_EXISTS);
        }

        Category parent = null;
        if (request.getParentId() != null) {
            parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        }

        Category category = Category.builder()
                .parent(parent)
                .name(request.getName().trim())
                .slug(request.getSlug().trim().toLowerCase())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        category = categoryRepository.save(category);
        return mapToDto(category);
    }

    public CategoryDto mapToDto(Category c) {
        return CategoryDto.builder()
                .id(c.getId())
                .parentId(c.getParent() != null ? c.getParent().getId() : null)
                .name(c.getName())
                .slug(c.getSlug())
                .isActive(c.getIsActive())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
