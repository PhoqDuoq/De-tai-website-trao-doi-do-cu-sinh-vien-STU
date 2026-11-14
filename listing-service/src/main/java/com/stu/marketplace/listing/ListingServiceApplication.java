package com.stu.marketplace.listing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Listing & Item Catalog Microservice entry point.
 * Manages second-hand goods listings, categories, and photos on database `stu_listing_db`.
 */
@SpringBootApplication
public class ListingServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ListingServiceApplication.class, args);
    }
}
