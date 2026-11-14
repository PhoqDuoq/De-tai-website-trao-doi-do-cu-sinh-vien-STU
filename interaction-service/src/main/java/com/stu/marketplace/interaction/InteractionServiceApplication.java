package com.stu.marketplace.interaction;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Interaction & Social Microservice entry point.
 * Manages item comments, reviews, favorites, and chat messages on database `stu_interaction_db`.
 */
@SpringBootApplication
public class InteractionServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(InteractionServiceApplication.class, args);
    }
}
