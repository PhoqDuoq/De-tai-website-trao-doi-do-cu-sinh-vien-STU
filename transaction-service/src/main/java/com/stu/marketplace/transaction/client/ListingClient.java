package com.stu.marketplace.transaction.client;

public interface ListingClient {

    boolean markListingAsSold(Long listingId, String authToken, String reason);
}
