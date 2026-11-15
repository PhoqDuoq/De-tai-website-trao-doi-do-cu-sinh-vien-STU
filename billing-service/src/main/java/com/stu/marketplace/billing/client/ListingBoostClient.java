package com.stu.marketplace.billing.client;

public interface ListingBoostClient {

    boolean activateBoost(Long listingId, int durationDays, String authToken);
}
