package com.stu.marketplace.billing.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Slf4j
@Component
public class ListingBoostRestClient implements ListingBoostClient {

    private final RestClient restClient;

    @Value("${stu.security.internal-service-key:stu-marketplace-internal-secret-key-2026}")
    private String internalServiceKey;

    public ListingBoostRestClient(@Value("${listing.service.url:http://localhost:8082}") String listingServiceUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(listingServiceUrl)
                .build();
    }

    @Override
    public boolean activateBoost(Long listingId, int durationDays, String authToken) {
        try {
            log.info("Notifying listing-service to activate boost for listing {} (duration: {} days)", listingId, durationDays);
            String authHeader = (authToken != null && !authToken.startsWith("Bearer ")) ? "Bearer " + authToken : authToken;

            var requestSpec = restClient.patch()
                    .uri("/api/v1/listings/{id}/boost", listingId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Internal-Service-Key", internalServiceKey);

            if (authHeader != null) {
                requestSpec.header(HttpHeaders.AUTHORIZATION, authHeader);
            }

            requestSpec.body(Map.of("durationDays", durationDays, "isBoosted", true))
                    .retrieve()
                    .toBodilessEntity();

            log.info("Successfully activated boost for listing {}", listingId);
            return true;
        } catch (Exception ex) {
            log.warn("Could not notify listing-service to activate boost for listing {}: {}. Proceeding resiliently.",
                    listingId, ex.getMessage());
            return false;
        }
    }
}
