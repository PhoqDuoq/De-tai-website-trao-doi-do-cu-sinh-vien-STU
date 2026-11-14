package com.stu.marketplace.moderation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Moderation & Safety Microservice entry point.
 * Manages scam reports, offensive keyword scanning, and moderation actions on database `stu_moderation_db`.
 */
@SpringBootApplication
public class ModerationServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ModerationServiceApplication.class, args);
    }
}
