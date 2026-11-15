package com.stu.marketplace.transaction.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Slf4j
@Component
public class ListingRestClient implements ListingClient {

    private final RestClient restClient;

    @Value("${stu.security.internal-service-key:stu-marketplace-internal-secret-key-2026}")
    private String internalServiceKey;

    public ListingRestClient(@Value("${listing.service.url:http://localhost:8082}") String listingServiceUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(listingServiceUrl)
                .build();
    }

    @Override
    public boolean markListingAsSold(Long listingId, String authToken, String reason) {
        try {
            log.info("Synchronizing listing {} to SOLD with listing-service", listingId);
            String authHeader = (authToken != null && !authToken.startsWith("Bearer ")) ? "Bearer " + authToken : authToken;

            var requestSpec = restClient.patch()
                    .uri("/api/v1/listings/{id}/sold-sync", listingId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Internal-Service-Key", internalServiceKey);

            if (authHeader != null) {
                requestSpec.header(HttpHeaders.AUTHORIZATION, authHeader);
            }

            requestSpec.body(Map.of("reason", reason != null ? reason : "Transaction completed"))
                    .retrieve()
                    .toBodilessEntity();

            log.info("Successfully updated listing {} status to SOLD", listingId);
            return true;
        } catch (Exception ex) {
            log.warn("Could not synchronize listing {} status to SOLD: {}. Proceeding resiliently.",
                    listingId, ex.getMessage());
            return false;
        }
    }
}
