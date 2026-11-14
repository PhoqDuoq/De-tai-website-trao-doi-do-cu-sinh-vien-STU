package com.stu.marketplace.transaction;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Transaction & Meetup Coordination Microservice entry point.
 * Coordinates student exchange proposals, campus meetup schedules, and deal completion on `stu_transaction_db`.
 * NOTE: Student-to-student payments are NOT processed through platform (cash/barter on meetup).
 */
@SpringBootApplication
public class TransactionServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(TransactionServiceApplication.class, args);
    }
}
