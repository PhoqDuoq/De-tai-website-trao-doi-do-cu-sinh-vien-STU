package com.stu.marketplace.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Standard business and HTTP error codes for the STU Marketplace platform.
 */
@Getter
public enum ErrorCode {

    // Generic HTTP / System codes
    SUCCESS(200, "Operation successful", HttpStatus.OK),
    CREATED(201, "Resource created successfully", HttpStatus.CREATED),
    BAD_REQUEST(400, "Bad request parameters", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED(401, "Unauthorized access", HttpStatus.UNAUTHORIZED),
    FORBIDDEN(403, "Access is forbidden", HttpStatus.FORBIDDEN),
    NOT_FOUND(404, "Requested resource not found", HttpStatus.NOT_FOUND),
    METHOD_NOT_ALLOWED(405, "HTTP method not supported", HttpStatus.METHOD_NOT_ALLOWED),
    CONFLICT(409, "Resource conflict detected", HttpStatus.CONFLICT),
    INTERNAL_SERVER_ERROR(500, "Internal server error occurred", HttpStatus.INTERNAL_SERVER_ERROR),
    SERVICE_UNAVAILABLE(503, "Service is temporarily unavailable", HttpStatus.SERVICE_UNAVAILABLE),

    // Identity Service (1000 - 1999)
    USER_NOT_FOUND(1001, "User profile not found", HttpStatus.NOT_FOUND),
    USER_ALREADY_EXISTS(1002, "User with this email already exists", HttpStatus.CONFLICT),
    INVALID_CREDENTIALS(1003, "Invalid email or password", HttpStatus.UNAUTHORIZED),
    UNVERIFIED_STUDENT(1004, "Student identity card has not been verified yet", HttpStatus.FORBIDDEN),
    STUDENT_ID_INVALID(1005, "Student ID format is invalid", HttpStatus.BAD_REQUEST),
    TOKEN_EXPIRED(1006, "JWT authentication token has expired", HttpStatus.UNAUTHORIZED),
    TOKEN_INVALID(1007, "JWT authentication token signature is invalid", HttpStatus.UNAUTHORIZED),
    ACCOUNT_SUSPENDED(1008, "User account is suspended or banned", HttpStatus.FORBIDDEN),
    STUDENT_CODE_ALREADY_EXISTS(1009, "Student ID code is already registered", HttpStatus.CONFLICT),
    VERIFICATION_ALREADY_SUBMITTED(1010, "Student verification is already submitted or verified", HttpStatus.CONFLICT),
    VERIFICATION_NOT_FOUND(1011, "Student verification request not found", HttpStatus.NOT_FOUND),
    INVALID_RESET_TOKEN(1012, "Password reset token is invalid or has expired", HttpStatus.BAD_REQUEST),
    REFRESH_TOKEN_NOT_FOUND(1013, "Refresh token not found or revoked", HttpStatus.UNAUTHORIZED),
    ACCOUNT_LOCKED(1014, "User account is locked or suspended", HttpStatus.FORBIDDEN),
    ACCOUNT_DISABLED(1015, "User account is disabled", HttpStatus.FORBIDDEN),

    // Listing Service (2000 - 2999)
    LISTING_NOT_FOUND(2001, "Listing item not found", HttpStatus.NOT_FOUND),
    CATEGORY_NOT_FOUND(2002, "Listing category not found", HttpStatus.NOT_FOUND),
    UNAUTHORIZED_LISTING_ACTION(2003, "User is not authorized to edit or delete this listing", HttpStatus.FORBIDDEN),
    LISTING_STATUS_INVALID(2004, "Cannot transition listing to requested status", HttpStatus.BAD_REQUEST),
    MAX_IMAGES_EXCEEDED(2005, "Maximum number of listing images exceeded", HttpStatus.BAD_REQUEST),
    CATEGORY_SLUG_EXISTS(2006, "Category with this slug already exists", HttpStatus.CONFLICT),
    LISTING_NOT_APPROVED(2007, "Listing must be reviewed and approved by a moderator before publishing", HttpStatus.BAD_REQUEST),

    // Interaction Service (3000 - 3999)
    CONVERSATION_NOT_FOUND(3001, "Conversation not found", HttpStatus.NOT_FOUND),
    MESSAGE_NOT_FOUND(3002, "Message not found", HttpStatus.NOT_FOUND),
    FAVORITE_ALREADY_EXISTS(3003, "Item is already in user's favorites", HttpStatus.CONFLICT),
    REVIEW_ALREADY_SUBMITTED(3004, "Review has already been submitted for this transaction", HttpStatus.CONFLICT),
    COMMENT_NOT_FOUND(3005, "Comment not found", HttpStatus.NOT_FOUND),
    UNAUTHORIZED_INTERACTION_ACTION(3006, "User is not authorized to perform this interaction action", HttpStatus.FORBIDDEN),
    CANNOT_CHAT_WITH_SELF(3007, "User cannot start conversation with themselves", HttpStatus.BAD_REQUEST),
    CANNOT_REVIEW_SELF(3008, "User cannot review themselves", HttpStatus.BAD_REQUEST),
    TRANSACTION_NOT_COMPLETED(3009, "Review can only be submitted for completed transactions", HttpStatus.BAD_REQUEST),
    FAVORITE_NOT_FOUND(3010, "Favorite item not found", HttpStatus.NOT_FOUND),

    // Transaction Service (4000 - 4999)
    TRANSACTION_NOT_FOUND(4001, "Transaction record not found", HttpStatus.NOT_FOUND),
    INVALID_TRANSACTION_STATUS(4002, "Illegal transaction status change", HttpStatus.BAD_REQUEST),
    CANNOT_TRANSACT_OWN_ITEM(4003, "Seller cannot transact or buy their own listing", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED_TRANSACTION_ACTION(4004, "User is not authorized to modify this transaction", HttpStatus.FORBIDDEN),
    INVALID_MEETING_TIME(4005, "Meeting time must be in the future", HttpStatus.BAD_REQUEST),
    INVALID_VERIFICATION_CODE(4006, "Transaction verification code is invalid", HttpStatus.BAD_REQUEST),
    TRANSACTION_ALREADY_TERMINATED(4007, "Transaction has already been completed or cancelled", HttpStatus.BAD_REQUEST),

    // Moderation Service (5000 - 5999)
    REPORT_NOT_FOUND(5001, "Moderation report not found", HttpStatus.NOT_FOUND),
    CONTENT_CONTAINS_FORBIDDEN_WORDS(5002, "Content contains prohibited or offensive keywords", HttpStatus.BAD_REQUEST),
    CANNOT_REPORT_SELF(5003, "User cannot report themselves", HttpStatus.BAD_REQUEST),
    REPORT_ALREADY_RESOLVED(5004, "Report has already been resolved or dismissed", HttpStatus.BAD_REQUEST),
    KEYWORD_ALREADY_EXISTS(5005, "Forbidden keyword already exists", HttpStatus.CONFLICT),
    KEYWORD_NOT_FOUND(5006, "Forbidden keyword not found", HttpStatus.NOT_FOUND),
    REPORT_ALREADY_EXISTS(5007, "A pending report for this target already exists", HttpStatus.CONFLICT),

    // Billing Service (6000 - 6999)
    FEE_PACKAGE_NOT_FOUND(6001, "Listing fee package not found", HttpStatus.NOT_FOUND),
    INVOICE_NOT_FOUND(6002, "Invoice record not found", HttpStatus.NOT_FOUND),
    PAYMENT_FAILED(6003, "Payment processing failed", HttpStatus.BAD_REQUEST),
    STUDENT_PAYMENT_PROHIBITED(6004, "Student-to-student payments are not supported on this platform", HttpStatus.BAD_REQUEST),
    INVOICE_ALREADY_PAID(6005, "Invoice has already been paid", HttpStatus.BAD_REQUEST),
    INVOICE_EXPIRED(6006, "Invoice is expired or cancelled", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED_BILLING_ACTION(6007, "User is not authorized to access or modify this billing resource", HttpStatus.FORBIDDEN),
    PACKAGE_INACTIVE(6008, "Listing fee package is inactive", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(int code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}
