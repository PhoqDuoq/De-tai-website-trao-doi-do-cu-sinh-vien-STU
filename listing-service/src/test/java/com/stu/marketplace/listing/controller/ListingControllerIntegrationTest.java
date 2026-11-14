package com.stu.marketplace.listing.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ListingControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

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

    @Test
    @DisplayName("POST /api/v1/listings without authentication token should return 401 Unauthorized")
    void testCreateListing_Unauthenticated_Returns401() throws Exception {
        String newListingJson = """
                {
                    "categoryId": 1,
                    "title": "Unauthorized Listing",
                    "description": "Test description",
                    "price": 100000,
                    "itemCondition": "USED",
                    "conditionPercent": 80
                }
                """;

        mockMvc.perform(post("/api/v1/listings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(newListingJson))
                .andExpect(status().isUnauthorized());
    }
}
