package com.stu.marketplace.listing.controller;

import com.stu.marketplace.listing.dto.CategoryDto;
import com.stu.marketplace.listing.dto.ListingFilterRequest;
import com.stu.marketplace.listing.dto.ListingResponse;
import com.stu.marketplace.listing.dto.PagedResponse;
import com.stu.marketplace.listing.service.CategoryService;
import com.stu.marketplace.listing.service.ListingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ListingControllerIntegrationTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        CategoryService categoryService = new CategoryService(null) {
            @Override
            public List<CategoryDto> getAllActiveCategories() {
                return List.of(CategoryDto.builder().id(1L).name("Giáo trình & Sách").slug("giao-trinh").build());
            }
        };

        ListingService listingService = new ListingService(null, null, null, null, null) {
            @Override
            public PagedResponse<ListingResponse> searchListings(ListingFilterRequest filter, boolean isStaff) {
                return PagedResponse.<ListingResponse>builder()
                        .content(List.of(ListingResponse.builder().id(100L).title("Test item").build()))
                        .page(0)
                        .size(10)
                        .totalElements(1)
                        .totalPages(1)
                        .last(true)
                        .build();
            }
        };

        ListingController listingController = new ListingController(listingService);
        CategoryController categoryController = new CategoryController(categoryService);
        mockMvc = MockMvcBuilders.standaloneSetup(listingController, categoryController).build();
    }

    @Test
    @DisplayName("GET /api/v1/categories should return 200 OK and list of active categories")
    void testGetCategories_Returns200() throws Exception {
        mockMvc.perform(get("/api/v1/categories")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("GET /api/v1/listings should return 200 OK with paged response")
    void testSearchListings_Returns200() throws Exception {
        mockMvc.perform(get("/api/v1/listings")
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.page").value(0));
    }
}
