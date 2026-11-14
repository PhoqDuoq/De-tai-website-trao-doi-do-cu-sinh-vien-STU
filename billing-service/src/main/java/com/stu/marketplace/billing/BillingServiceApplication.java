package com.stu.marketplace.billing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Billing & Listing Fee Microservice entry point.
 * Collects platform listing boost & VIP package fees on database `stu_billing_db`.
 * ARCHITECTURAL CONSTRAINT: NO student-to-student payments or wallet escrow.
 */
@SpringBootApplication
public class BillingServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(BillingServiceApplication.class, args);
    }
}
