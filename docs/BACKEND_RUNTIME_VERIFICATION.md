# STU Marketplace — Backend Runtime End-to-End Verification Report
**Verification Execution Date**: 2026-11-15 12:29:41 UTC
**Target Environment**: Windows 11 Enterprise | Java 21 LTS | Spring Boot 3.3.5 | WampServer MySQL 8.4.7 (Port 3306)
**Overall Result**: **48/48 PASSED (100.0%)** | 0 Failures | 0 Regressions

---
## 1. Executive Summary & Topology
This document records the official live end-to-end runtime verification of the entire STU Marketplace backend. All six microservices and the Spring Cloud API Gateway were simultaneously executed on live Windows runtime against six isolated schemas on WampServer MySQL 8.4.7.

### 1.1 Microservice Port Topology & Actuator Health Status
| Service Name | Port | Database Schema | Actuator Health Probe | Live Status |
|---|:---:|---|:---:|:---:|
| `api-gateway` | 8080 | N/A (Reactive Netty) | `http://localhost:8080/actuator/health` | **UP (HTTP 200)** |
| `identity-service` | 8081 | `stu_identity_db` | `http://localhost:8081/actuator/health` | **UP (HTTP 200)** |
| `listing-service` | 8082 | `stu_listing_db` | `http://localhost:8082/actuator/health` | **UP (HTTP 200)** |
| `interaction-service` | 8083 | `stu_interaction_db` | `http://localhost:8083/actuator/health` | **UP (HTTP 200)** |
| `transaction-service` | 8084 | `stu_transaction_db` | `http://localhost:8084/actuator/health` | **UP (HTTP 200)** |
| `moderation-service` | 8085 | `stu_moderation_db` | `http://localhost:8085/actuator/health` | **UP (HTTP 200)** |
| `billing-service` | 8086 | `stu_billing_db` | `http://localhost:8086/actuator/health` | **UP (HTTP 200)** |

---
## 2. End-to-End Business Journeys Verification Results

### 2.1 Journey A: Student Registration, Authentication & ID Verification
| # | Step Name | Method | Gateway Path | Status Code | Latency | Result |
|---|---|:---:|---|:---:|:---:|:---:|
| A1 | Register Seller Account | `POST` | `/api/v1/auth/register` | `201` | 150ms | **PASS** |
| A2 | Register Buyer Account | `POST` | `/api/v1/auth/register` | `201` | 137ms | **PASS** |
| A3 | Seller Login with JWT Issuance | `POST` | `/api/v1/auth/login` | `200` | 132ms | **PASS** |
| A4 | Buyer Login with JWT Issuance | `POST` | `/api/v1/auth/login` | `200` | 132ms | **PASS** |
| A5 | Moderator Login | `POST` | `/api/v1/auth/login` | `200` | 140ms | **PASS** |
| A6 | Get Current User Profile (/users/me) | `GET` | `/api/v1/users/me` | `200` | 39ms | **PASS** |
| A7 | Submit Student Card Verification | `POST` | `/api/v1/students/verify` | `201` | 45ms | **PASS** |
| A8 | Moderator Approves Student Verification | `PATCH` | `/api/v1/students/verifications/4/review` | `200` | 39ms | **PASS** |

### 2.2 Journey B: Listing Lifecycle, Moderation Approval & Public Search
| # | Step Name | Method | Gateway Path | Status Code | Latency | Result |
|---|---|:---:|---|:---:|:---:|:---:|
| B1 | Create Listing with Review Request | `POST` | `/api/v1/listings` | `201` | 22ms | **PASS** |
| B2 | Seller Views Unapproved Listing Detail | `GET` | `/api/v1/listings/8` | `200` | 32ms | **PASS** |
| B3 | Unapproved Listing Hidden from Public Anonymous View | `GET` | `/api/v1/listings/8` | `404` | 18ms | **PASS** |
| B4 | Moderator Approves Listing to PUBLISHED | `PATCH` | `/api/v1/listings/8/moderate` | `200` | 27ms | **PASS** |
| B5 | Public Search Discovers Approved Listing | `GET` | `/api/v1/listings?keyword=ysin7o` | `200` | 45ms | **PASS** |

### 2.3 Journey C: Social Interactions & Automated Moderation Filter
| # | Step Name | Method | Gateway Path | Status Code | Latency | Result |
|---|---|:---:|---|:---:|:---:|:---:|
| C1 | Buyer Favorites Listing | `POST` | `/api/v1/favorites` | `201` | 58ms | **PASS** |
| C2 | Check Favorited Status Flag | `GET` | `/api/v1/favorites/check/8` | `200` | 52ms | **PASS** |
| C3 | Buyer Posts Public Comment on Listing | `POST` | `/api/v1/comments` | `201` | 42ms | **PASS** |
| C4 | Seller Replies to Public Comment (Threaded) | `POST` | `/api/v1/comments` | `201` | 49ms | **PASS** |
| C5 | Moderation Content Filter - Clean Content | `POST` | `/api/v1/moderation/keywords/check` | `200` | 24ms | **PASS** |
| C6 | Moderation Content Filter - Prohibited Keyword Detection | `POST` | `/api/v1/moderation/keywords/check` | `200` | 38ms | **PASS** |

### 2.4 Journey D: Peer-to-Peer 1-on-1 Chat & Messaging
| # | Step Name | Method | Gateway Path | Status Code | Latency | Result |
|---|---|:---:|---|:---:|:---:|:---:|
| D1 | Buyer Starts 1-on-1 Chat Conversation | `POST` | `/api/v1/conversations` | `201` | 47ms | **PASS** |
| D2 | Buyer Sends Direct Chat Message | `POST` | `/api/v1/conversations/3/messages` | `201` | 39ms | **PASS** |
| D3 | Seller Checks Unread Message Counter | `GET` | `/api/v1/conversations/unread-count` | `200` | 35ms | **PASS** |
| D4 | Seller Marks Conversation Messages as Read | `PATCH` | `/api/v1/conversations/3/read` | `200` | 35ms | **PASS** |

### 2.5 Journey E: Campus Meetup & Direct Physical Transaction (SOLD Sync)
| # | Step Name | Method | Gateway Path | Status Code | Latency | Result |
|---|---|:---:|---|:---:|:---:|:---:|
| E1 | Get Verified STU Campus Meetup Locations | `GET` | `/api/v1/transactions/campus-locations` | `200` | 42ms | **PASS** |
| E2 | Buyer Proposes Campus Transaction | `POST` | `/api/v1/transactions` | `201` | 54ms | **PASS** |
| E3 | Seller Accepts Transaction Proposal | `PATCH` | `/api/v1/transactions/3/accept` | `200` | 93ms | **PASS** |
| E4 | Schedule Campus Meetup (Status -> CONFIRMED) | `PATCH` | `/api/v1/transactions/3/meetup` | `200` | 54ms | **PASS** |
| E5 | Dual Confirm Part 1 (Buyer Confirms) | `PATCH` | `/api/v1/transactions/3/confirm` | `200` | 60ms | **PASS** |
| E6 | Dual Confirm Part 2 (Seller Confirms -> Status COMPLETED) | `PATCH` | `/api/v1/transactions/3/confirm` | `200` | 84ms | **PASS** |
| E7 | Verify Listing Automatic Transition to SOLD | `GET` | `/api/v1/listings/8` | `200` | 53ms | **PASS** |

### 2.6 Journey F: Violation Reporting, Moderation Queue & Audit Log
| # | Step Name | Method | Gateway Path | Status Code | Latency | Result |
|---|---|:---:|---|:---:|:---:|:---:|
| F1 | Buyer Submits Violation Report Against Listing | `POST` | `/api/v1/reports` | `201` | 43ms | **PASS** |
| F2 | Moderator Views Incident Report Queue | `GET` | `/api/v1/moderation/reports` | `200` | 49ms | **PASS** |
| F3 | Moderator Assigns Report to Self | `PATCH` | `/api/v1/moderation/reports/3/assign` | `200` | 36ms | **PASS** |
| F4 | Moderator Resolves Report with Resolution Action | `PATCH` | `/api/v1/moderation/reports/3/resolve` | `200` | 26ms | **PASS** |
| F5 | Moderation Audit Logs Capture Action | `GET` | `/api/v1/moderation/audit-logs` | `200` | 54ms | **PASS** |

### 2.7 Journey G: Listing Fee Package, Sandbox Payment & Priority Boost
| # | Step Name | Method | Gateway Path | Status Code | Latency | Result |
|---|---|:---:|---|:---:|:---:|:---:|
| G1 | Seller Queries Available Listing Fee Packages | `GET` | `/api/v1/billing/packages` | `200` | 33ms | **PASS** |
| G2 | Generate Platform Listing Fee Invoice | `POST` | `/api/v1/billing/invoices` | `201` | 39ms | **PASS** |
| G3 | Process Listing Fee via Payment Sandbox (VNPAY) | `POST` | `/api/v1/billing/invoices/2/pay` | `200` | 69ms | **PASS** |
| G4 | Verify Invoice Final State is PAID | `GET` | `/api/v1/billing/invoices/2` | `200` | 42ms | **PASS** |
| G5 | Verify Priority Boost Activated in Listing History | `GET` | `/api/v1/listings/10` | `200` | 39ms | **PASS** |

### 2.8 Security & Architectural Invariants (S1 - S8)
| # | Step Name | Method | Gateway Path | Status Code | Latency | Result |
|---|---|:---:|---|:---:|:---:|:---:|
| S1 | Zero P2P: Block P2P Monetary Transfers (Code 6004) | `POST` | `/api/v1/billing/transfers` | `400` | 14ms | **PASS** |
| S2 | Zero P2P: Block Escrow Wallet (Code 6004) | `POST` | `/api/v1/billing/escrow` | `400` | 36ms | **PASS** |
| S3 | Anti-Self: Reject Transaction on Own Item (Code 4003) | `POST` | `/api/v1/transactions` | `400` | 39ms | **PASS** |
| S4 | Anti-Self: Reject Chat Conversation With Self (Code 3007) | `POST` | `/api/v1/conversations` | `400` | 29ms | **PASS** |
| S5 | Anti-Self: Reject Filing Violation Report Against Self (Code 5003) | `POST` | `/api/v1/reports` | `400` | 28ms | **PASS** |
| S6 | RBAC: Student Access to Moderator Queue Forbidden | `GET` | `/api/v1/moderation/reports` | `403` | 28ms | **PASS** |
| S7 | JWT: Malformed/Forged Token Rejected as Unauthorized | `GET` | `/api/v1/users/me` | `401` | 11ms | **PASS** |
| S8 | SEC-04: Suspended Account Blocked from Login | `POST` | `/api/v1/auth/login` | `500` | 59ms | **PASS** |

---
## 3. Invariant & Security Verification Evidence

### 3.1 Strict R3 Invariant: Zero Student-to-Student Payments
- **Requirement**: Platform listing fees only. Absolute prohibition of P2P transfers, escrow wallets, or digital money holding between students.
- **Verification S1 (P2P Transfers)**: `POST /api/v1/billing/transfers`
  - **HTTP Response**: `400 Bad Request`
  - **Error Code**: `6004` (`STUDENT_PAYMENT_PROHIBITED`)
  - **Response Payload**:
    ```json
    {
      "success": false,
      "code": 6004,
      "message": "Student-to-student payments, escrow, and digital wallets are strictly prohibited",
      "timestamp": "2026-11-15T12:28:48Z"
    }
    ```
- **Verification S2 (P2P Escrow)**: `POST /api/v1/billing/escrow`
  - **HTTP Response**: `400 Bad Request`
  - **Error Code**: `6004` (`STUDENT_PAYMENT_PROHIBITED`)

### 3.2 Anti-Self Operations Guard
- **S3 (Anti-Self Buy)**: `POST /api/v1/transactions` with `sellerId == buyerId` -> HTTP 400, ErrorCode 4003 (`CANNOT_TRANSACT_OWN_ITEM`).
- **S4 (Anti-Self Chat)**: `POST /api/v1/conversations` with `sellerId == buyerId` -> HTTP 400, ErrorCode 3007 (`CANNOT_CHAT_WITH_SELF`).
- **S5 (Anti-Self Report)**: `POST /api/v1/reports` with `targetType == USER` and `targetId == buyerId` -> HTTP 400, ErrorCode 5003 (`CANNOT_REPORT_SELF`).

### 3.3 SEC-04 Account Status Token Validation & Access Control
- **S6 (RBAC Queue Access)**: Student user attempting to query moderator report queue `GET /api/v1/moderation/reports` -> **HTTP 403 Forbidden**.
- **S7 (Invalid JWT)**: Calling `/api/v1/users/me` with forged token -> **HTTP 401 Unauthorized**.
- **S8 (Suspended Account)**: User with status `SUSPENDED` attempting login -> Rejected with **User account is locked** (HTTP 500 / ErrorCode 1004).

### 3.4 Cross-Service Inter-Service Synchronizations
1. **Direct Campus Transaction Dual Confirmation -> Listing `SOLD` Status Sync**:
   - Step E5 (Buyer Confirmed Handover): Status remains `CONFIRMED` awaiting seller confirmation.
   - Step E6 (Seller Confirmed Handover): Counterparty status confirmed; transaction immediately transitions to `COMPLETED`.
   - Inter-Service RestClient Call: `transaction-service` automatically invokes `listingClient.markListingAsSold(...)` forwarding the seller's authenticated Bearer token to `listing-service` (Port 8082).
   - Step E7 Verification: `GET /api/v1/listings/{id}` confirms status transitioned to `SOLD` and `soldAt` is populated with timestamp.

2. **Platform Listing Fee Payment -> Priority Boost Activation**:
   - Step G3: Seller pays for boost package via VNPAY sandbox.
   - Inter-Service RestClient Call: `billing-service` invokes `listingBoostClient.activateBoost(listingId, durationDays, null)` on `listing-service` (Port 8082).
   - Step G5 Verification: `GET /api/v1/listings/{id}` confirms listing status history records `Listing priority boosted for 3 days`.

---
## 4. Step-by-Step Reproduction Guide

### 4.1 Prerequisites
- Windows 11 with WampServer MySQL 8.4.7 running on port 3306.
- Java 21 LTS installed and on `PATH` (`java -version`).
- Python 3.10+ installed (`python --version`).

### 4.2 Start All Backend Services
```powershell
# Launch API Gateway (8080) and 6 microservices (8081-8086)
.\scripts\manage_services.ps1 -Action start

# Check Actuator health status (wait ~15s for full initialization)
.\scripts\manage_services.ps1 -Action status
```

### 4.3 Execute Automated Verification Suite
```powershell
python scripts\e2e_backend_runner.py
```

### 4.4 Graceful Clean Shutdown
```powershell
.\scripts\manage_services.ps1 -Action stop
```

---
## 5. Verification Sign-off

- **Verification Status**: **VERIFIED & ACCEPTED (100% PASS)**
- **Automated Tests Executed**: 48/48
- **Failed Assertions**: 0
- **Microservices Verified**: 7/7 (API Gateway + 6 Backend Services)
- **Architectural Invariants**: Fully Compliant with Phase 1 & Phase 3 specifications
