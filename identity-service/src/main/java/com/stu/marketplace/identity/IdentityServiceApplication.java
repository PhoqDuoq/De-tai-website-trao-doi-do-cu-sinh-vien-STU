package com.stu.marketplace.identity;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Identity & Authentication Microservice entry point.
 * Manages user accounts, student verification, and JWT issuance on database `stu_identity_db`.
 */
@SpringBootApplication
public class IdentityServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(IdentityServiceApplication.class, args);
    }
}
