package com.stu.marketplace.common.constant;

/**
 * Database schema and isolation rule constants.
 * Enforces requirement R3: strict microservice database isolation on WampServer MySQL (port 3306).
 */
public final class DatabaseConstants {

    private DatabaseConstants() {
        // Private constructor to prevent instantiation
    }

    public static final String DB_IDENTITY = "stu_identity_db";
    public static final String DB_LISTING = "stu_listing_db";
    public static final String DB_INTERACTION = "stu_interaction_db";
    public static final String DB_TRANSACTION = "stu_transaction_db";
    public static final String DB_MODERATION = "stu_moderation_db";
    public static final String DB_BILLING = "stu_billing_db";

    /**
     * Architectural Invariant:
     * Cross-database foreign keys and cross-database SQL joins are strictly forbidden.
     * All cross-domain references must be stored as scalar identifiers (e.g. userId, listingId).
     */
    public static final String ISOLATION_POLICY = "STRICT_MICROSERVICE_ISOLATION_ZERO_CROSS_DB_FK";
}
