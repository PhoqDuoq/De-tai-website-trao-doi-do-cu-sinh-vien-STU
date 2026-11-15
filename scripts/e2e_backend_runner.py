"""
STU Marketplace - Backend Runtime End-to-End Verification Harness
Validates live HTTP communication across API Gateway (8080) and all 6 microservices (8081-8086).
Covers Journeys A-G and Architectural/Security Invariants S1-S8.
Uses only the Python standard library.
"""

import json
import random
import string
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime

GATEWAY_BASE = "http://localhost:8080"
SERVICES = {
    "api-gateway": "http://localhost:8080",
    "identity-service": "http://localhost:8081",
    "listing-service": "http://localhost:8082",
    "interaction-service": "http://localhost:8083",
    "transaction-service": "http://localhost:8084",
    "moderation-service": "http://localhost:8085",
    "billing-service": "http://localhost:8086"
}

test_records = []

def make_request(method, url, data=None, token=None):
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    encoded_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            elapsed_ms = int((time.time() - start) * 1000)
            raw_body = resp.read().decode("utf-8")
            try:
                body = json.loads(raw_body)
            except Exception:
                body = raw_body
            return {"status": resp.status, "body": body, "elapsed_ms": elapsed_ms, "error": None}
    except urllib.error.HTTPError as e:
        elapsed_ms = int((time.time() - start) * 1000)
        raw_body = e.read().decode("utf-8")
        try:
            body = json.loads(raw_body)
        except Exception:
            body = raw_body
        return {"status": e.code, "body": body, "elapsed_ms": elapsed_ms, "error": str(e)}
    except Exception as e:
        elapsed_ms = int((time.time() - start) * 1000)
        return {"status": 0, "body": None, "elapsed_ms": elapsed_ms, "error": str(e)}

def record_test(journey, step_id, name, method, path, expected_status, res, check_fn=None):
    actual_status = res["status"]
    if isinstance(expected_status, (list, tuple)):
        status_match = (actual_status in expected_status)
    else:
        status_match = (actual_status == expected_status)
    body_check = True
    check_error = None
    if check_fn and status_match:
        try:
            body_check = bool(check_fn(res["body"]))
        except Exception as ex:
            body_check = False
            check_error = str(ex)
    
    passed = status_match and body_check
    rec = {
        "journey": journey,
        "step_id": step_id,
        "name": name,
        "method": method,
        "path": path,
        "expected_status": expected_status,
        "actual_status": actual_status,
        "elapsed_ms": res["elapsed_ms"],
        "passed": passed,
        "check_error": check_error,
        "body": res["body"]
    }
    test_records.append(rec)
    flag = "PASS" if passed else "FAIL"
    print(f"[{flag}] {step_id} - {name} ({method} {path}) -> HTTP {actual_status} (expected {expected_status}) in {res['elapsed_ms']}ms")
    if not passed:
        print(f"       ERROR / BODY: {res['body']}")
        if check_error:
            print(f"       ASSERTION EXCEPTION: {check_error}")
    return passed

def rand_str(length=6):
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=length))

def run_e2e_suite():
    print("=" * 80)
    print("STU MARKETPLACE - BACKEND RUNTIME END-TO-END VERIFICATION")
    print(f"Timestamp: {datetime.now().isoformat()}Z")
    print(f"Gateway Base URL: {GATEWAY_BASE}")
    print("=" * 80)

    # -------------------------------------------------------------------------
    # Pre-Flight: Actuator Health Probing
    # -------------------------------------------------------------------------
    print("\n--- PRE-FLIGHT: ACTUATOR HEALTH CHECKS ---")
    all_healthy = True
    health_results = {}
    for svc_name, base_url in SERVICES.items():
        res = make_request("GET", f"{base_url}/actuator/health")
        is_up = (res["status"] == 200 and isinstance(res["body"], dict) and res["body"].get("status") == "UP")
        health_results[svc_name] = "UP" if is_up else "DOWN"
        if not is_up:
            all_healthy = False
        print(f"  {svc_name.ljust(22)} ({base_url}) -> {health_results[svc_name]} (HTTP {res['status']})")
    
    if not all_healthy:
        print("ERROR: Not all services are healthy (UP). Aborting test suite.")
        sys.exit(1)
    print("All 7 services report status UP. Commencing E2E Journeys.\n")

    # Generate unique test user credentials
    suffix = rand_str(6)
    seller_email = f"seller_{suffix}@stu.edu.vn"
    buyer_email = f"buyer_{suffix}@stu.edu.vn"
    password = "Password123!"

    context = {}

    # -------------------------------------------------------------------------
    # Journey A: Student Registration, Login & Verification
    # -------------------------------------------------------------------------
    print("\n--- JOURNEY A: Student Registration, Login & Verification ---")
    
    # A1: Register Seller
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/auth/register", {
        "email": seller_email,
        "password": password,
        "fullName": f"Nguyen Van Seller {suffix}",
        "studentCode": f"DH{suffix.upper()}",
        "phone": "0912345678"
    })
    record_test("Journey A", "A1", "Register Seller Account", "POST", "/api/v1/auth/register", (200, 201), res,
                lambda b: b.get("success") is True and "accessToken" in b.get("data", {}))
    context["seller_token"] = res["body"]["data"]["accessToken"]
    context["seller_id"] = res["body"]["data"]["user"]["id"]

    # A2: Register Buyer
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/auth/register", {
        "email": buyer_email,
        "password": password,
        "fullName": f"Tran Thi Buyer {suffix}",
        "studentCode": f"SV{suffix.upper()}",
        "phone": "0987654321"
    })
    record_test("Journey A", "A2", "Register Buyer Account", "POST", "/api/v1/auth/register", (200, 201), res,
                lambda b: b.get("success") is True and "accessToken" in b.get("data", {}))
    context["buyer_token"] = res["body"]["data"]["accessToken"]
    context["buyer_id"] = res["body"]["data"]["user"]["id"]

    # A3: Login Seller
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/auth/login", {
        "emailOrStudentCode": seller_email,
        "password": password
    })
    record_test("Journey A", "A3", "Seller Login with JWT Issuance", "POST", "/api/v1/auth/login", 200, res,
                lambda b: b.get("success") is True and b["data"]["accessToken"] is not None)
    context["seller_token"] = res["body"]["data"]["accessToken"]

    # A4: Login Buyer
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/auth/login", {
        "emailOrStudentCode": buyer_email,
        "password": password
    })
    record_test("Journey A", "A4", "Buyer Login with JWT Issuance", "POST", "/api/v1/auth/login", 200, res,
                lambda b: b.get("success") is True and b["data"]["accessToken"] is not None)
    context["buyer_token"] = res["body"]["data"]["accessToken"]

    # A5: Login Moderator
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/auth/login", {
        "emailOrStudentCode": "moderator_e2e@stu.edu.vn",
        "password": "Password123!"
    })
    record_test("Journey A", "A5", "Moderator Login", "POST", "/api/v1/auth/login", 200, res,
                lambda b: b.get("success") is True and "MODERATOR" in str(b["data"]["user"]["roles"]))
    context["mod_token"] = res["body"]["data"]["accessToken"]

    # A6: Get Seller Profile
    res = make_request("GET", f"{GATEWAY_BASE}/api/v1/users/me", token=context["seller_token"])
    record_test("Journey A", "A6", "Get Current User Profile (/users/me)", "GET", "/api/v1/users/me", 200, res,
                lambda b: b.get("data", {}).get("email") == seller_email)

    # A7: Submit Student Verification
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/students/verify", {
        "method": "MANUAL_REVIEW",
        "evidenceReference": f"https://cdn.stu.edu.vn/cards/student_{suffix}.jpg",
        "studentCode": f"DH{suffix.upper()}"
    }, token=context["seller_token"])
    record_test("Journey A", "A7", "Submit Student Card Verification", "POST", "/api/v1/students/verify", 201, res,
                lambda b: b.get("data", {}).get("status") == "PENDING")
    context["verification_id"] = res["body"]["data"]["id"]

    # A8: Moderator Approves Verification
    res = make_request("PATCH", f"{GATEWAY_BASE}/api/v1/students/verifications/{context['verification_id']}/review", {
        "status": "APPROVED",
        "note": "Verified valid STU student card from IT faculty"
    }, token=context["mod_token"])
    record_test("Journey A", "A8", "Moderator Approves Student Verification", "PATCH",
                f"/api/v1/students/verifications/{context['verification_id']}/review", 200, res,
                lambda b: b.get("data", {}).get("status") == "APPROVED")

    # -------------------------------------------------------------------------
    # Journey B: Listing Creation, Moderation Approval & Public Catalog
    # -------------------------------------------------------------------------
    print("\n--- JOURNEY B: Listing Lifecycle & Moderation ---")

    # B1: Create Listing (PENDING_REVIEW)
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/listings", {
        "categoryId": 1,
        "title": f"Giao trinh Java Spring Boot Microservices {suffix}",
        "description": "Tai lieu hoc tap chuyen nganh Cong nghe thong tin STU, con rat moi.",
        "price": 50000.00,
        "itemCondition": "LIKE_NEW",
        "conditionPercent": 95,
        "submitForReview": True,
        "images": []
    }, token=context["seller_token"])
    record_test("Journey B", "B1", "Create Listing with Review Request", "POST", "/api/v1/listings", 201, res,
                lambda b: b.get("data", {}).get("status") == "PENDING_REVIEW")
    context["listing_1_id"] = res["body"]["data"]["id"]

    # B2: Get Listing Detail as Seller
    res = make_request("GET", f"{GATEWAY_BASE}/api/v1/listings/{context['listing_1_id']}", token=context["seller_token"])
    record_test("Journey B", "B2", "Seller Views Unapproved Listing Detail", "GET",
                f"/api/v1/listings/{context['listing_1_id']}", 200, res,
                lambda b: b.get("data", {}).get("status") == "PENDING_REVIEW")

    # B3: Unapproved Listing Hidden from Public (Anonymous)
    res = make_request("GET", f"{GATEWAY_BASE}/api/v1/listings/{context['listing_1_id']}")
    record_test("Journey B", "B3", "Unapproved Listing Hidden from Public Anonymous View", "GET",
                f"/api/v1/listings/{context['listing_1_id']}", 404, res)

    # B4: Moderator Approves Listing to PUBLISHED
    res = make_request("PATCH", f"{GATEWAY_BASE}/api/v1/listings/{context['listing_1_id']}/moderate", {
        "status": "PUBLISHED",
        "reason": "Listing satisfies STU marketplace community guidelines"
    }, token=context["mod_token"])
    record_test("Journey B", "B4", "Moderator Approves Listing to PUBLISHED", "PATCH",
                f"/api/v1/listings/{context['listing_1_id']}/moderate", 200, res,
                lambda b: b.get("data", {}).get("status") == "PUBLISHED" and b["data"]["publishedAt"] is not None)

    # B5: Search Public Listings (Anonymous)
    res = make_request("GET", f"{GATEWAY_BASE}/api/v1/listings?keyword={suffix}")
    record_test("Journey B", "B5", "Public Search Discovers Approved Listing", "GET",
                f"/api/v1/listings?keyword={suffix}", 200, res,
                lambda b: any(item["id"] == context["listing_1_id"] for item in b.get("data", {}).get("content", [])))

    # -------------------------------------------------------------------------
    # Journey C: Interaction & Moderation Filter
    # -------------------------------------------------------------------------
    print("\n--- JOURNEY C: Interaction & Moderation Filter ---")

    # C1: Buyer Favorites Listing
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/favorites", {
        "listingId": context["listing_1_id"]
    }, token=context["buyer_token"])
    record_test("Journey C", "C1", "Buyer Favorites Listing", "POST", "/api/v1/favorites", 201, res,
                lambda b: b.get("data", {}).get("listingId") == context["listing_1_id"])

    # C2: Buyer Checks Favorited Status
    res = make_request("GET", f"{GATEWAY_BASE}/api/v1/favorites/check/{context['listing_1_id']}", token=context["buyer_token"])
    record_test("Journey C", "C2", "Check Favorited Status Flag", "GET",
                f"/api/v1/favorites/check/{context['listing_1_id']}", 200, res,
                lambda b: b.get("data", {}).get("favorited") is True)

    # C3: Buyer Posts Public Comment
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/comments", {
        "listingId": context["listing_1_id"],
        "content": "Ban oi, sach nay con bai tap kem theo khong?"
    }, token=context["buyer_token"])
    record_test("Journey C", "C3", "Buyer Posts Public Comment on Listing", "POST", "/api/v1/comments", 201, res,
                lambda b: b.get("data", {}).get("id") is not None)
    context["comment_id"] = res["body"]["data"]["id"]

    # C4: Seller Replies to Comment
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/comments", {
        "listingId": context["listing_1_id"],
        "parentId": context["comment_id"],
        "content": "Con day du bai tap va slide ban nhe!"
    }, token=context["seller_token"])
    record_test("Journey C", "C4", "Seller Replies to Public Comment (Threaded)", "POST", "/api/v1/comments", 201, res,
                lambda b: b.get("data", {}).get("parentId") == context["comment_id"])

    # C5: Clean Keyword Check
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/moderation/keywords/check", {
        "text": "Ban sach giao trinh cong nghe thong tin STU chinh hang rat re"
    })
    record_test("Journey C", "C5", "Moderation Content Filter - Clean Content", "POST",
                "/api/v1/moderation/keywords/check", 200, res,
                lambda b: b.get("data", {}).get("clean") is True)

    # C6: Prohibited Keyword Check
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/moderation/keywords/check", {
        "text": "Toi can ban vũ khí nguy hiem va chat ma tuy"
    })
    record_test("Journey C", "C6", "Moderation Content Filter - Prohibited Keyword Detection", "POST",
                "/api/v1/moderation/keywords/check", 200, res,
                lambda b: b.get("data", {}).get("clean") is False and b.get("data", {}).get("suggestedAction") == "AUTO_REJECT")

    # -------------------------------------------------------------------------
    # Journey D: Chat & Messaging
    # -------------------------------------------------------------------------
    print("\n--- JOURNEY D: Peer-to-Peer Chat & Messaging ---")

    # D1: Buyer Starts Conversation
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/conversations", {
        "listingId": context["listing_1_id"],
        "sellerId": context["seller_id"]
    }, token=context["buyer_token"])
    record_test("Journey D", "D1", "Buyer Starts 1-on-1 Chat Conversation", "POST", "/api/v1/conversations", 201, res,
                lambda b: b.get("data", {}).get("id") is not None)
    context["conv_id"] = res["body"]["data"]["id"]

    # D2: Buyer Sends Message
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/conversations/{context['conv_id']}/messages", {
        "content": "Chao ban, minh muon hen gap o Canteen STU sang mai de xem sach.",
        "messageType": "TEXT"
    }, token=context["buyer_token"])
    record_test("Journey D", "D2", "Buyer Sends Direct Chat Message", "POST",
                f"/api/v1/conversations/{context['conv_id']}/messages", 201, res,
                lambda b: b.get("data", {}).get("isRead") is False)

    # D3: Seller Checks Unread Count
    res = make_request("GET", f"{GATEWAY_BASE}/api/v1/conversations/unread-count", token=context["seller_token"])
    record_test("Journey D", "D3", "Seller Checks Unread Message Counter", "GET",
                "/api/v1/conversations/unread-count", 200, res,
                lambda b: b.get("data", {}).get("unreadCount", 0) >= 1)

    # D4: Seller Marks Conversation as Read
    res = make_request("PATCH", f"{GATEWAY_BASE}/api/v1/conversations/{context['conv_id']}/read", token=context["seller_token"])
    record_test("Journey D", "D4", "Seller Marks Conversation Messages as Read", "PATCH",
                f"/api/v1/conversations/{context['conv_id']}/read", 200, res,
                lambda b: b.get("success") is True)

    # -------------------------------------------------------------------------
    # Journey E: Campus Meetup & Direct Transaction (with SOLD sync)
    # -------------------------------------------------------------------------
    print("\n--- JOURNEY E: Direct Campus Transaction & SOLD Sync ---")

    # E1: Get Campus Locations
    res = make_request("GET", f"{GATEWAY_BASE}/api/v1/transactions/campus-locations")
    record_test("Journey E", "E1", "Get Verified STU Campus Meetup Locations", "GET",
                "/api/v1/transactions/campus-locations", 200, res,
                lambda b: len(b.get("data", [])) > 0)

    # E2: Buyer Proposes Transaction
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/transactions", {
        "listingId": context["listing_1_id"],
        "sellerId": context["seller_id"],
        "agreedPrice": 45000.00,
        "transactionType": "BUY_SELL",
        "meetingLocation": "STU Canteen khu A",
        "meetingTime": "2026-11-20T10:00:00",
        "note": "Gap trao doi truc tiep tai truong"
    }, token=context["buyer_token"])
    record_test("Journey E", "E2", "Buyer Proposes Campus Transaction", "POST", "/api/v1/transactions", 201, res,
                lambda b: b.get("data", {}).get("status") == "REQUESTED")
    context["tx_id"] = res["body"]["data"]["id"]

    # E3: Seller Accepts Proposal
    res = make_request("PATCH", f"{GATEWAY_BASE}/api/v1/transactions/{context['tx_id']}/accept", token=context["seller_token"])
    record_test("Journey E", "E3", "Seller Accepts Transaction Proposal", "PATCH",
                f"/api/v1/transactions/{context['tx_id']}/accept", 200, res,
                lambda b: b.get("data", {}).get("status") == "ACCEPTED")

    # E4: Schedule Campus Meetup (Transitions to CONFIRMED)
    res = make_request("PATCH", f"{GATEWAY_BASE}/api/v1/transactions/{context['tx_id']}/meetup", {
        "meetingLocation": "Sanh toa nha A - Truong DH Cong nghe Sai Gon (STU)",
        "meetingTime": "2026-11-20T14:30:00",
        "note": "Hen gap dung gio o sanh A"
    }, token=context["seller_token"])
    record_test("Journey E", "E4", "Schedule Campus Meetup (Status -> CONFIRMED)", "PATCH",
                f"/api/v1/transactions/{context['tx_id']}/meetup", 200, res,
                lambda b: b.get("data", {}).get("status") == "CONFIRMED")

    # E5: Dual Confirm Part 1 (Buyer confirms completion)
    res = make_request("PATCH", f"{GATEWAY_BASE}/api/v1/transactions/{context['tx_id']}/confirm", {
        "note": "Da gap nguoi ban va kiem tra giao trinh tot"
    }, token=context["buyer_token"])
    record_test("Journey E", "E5", "Dual Confirm Part 1 (Buyer Confirms)", "PATCH",
                f"/api/v1/transactions/{context['tx_id']}/confirm", 200, res,
                lambda b: b.get("data", {}).get("status") == "CONFIRMED")

    # E6: Dual Confirm Part 2 (Seller confirms -> completes transaction & triggers SOLD sync)
    res = make_request("PATCH", f"{GATEWAY_BASE}/api/v1/transactions/{context['tx_id']}/confirm", {
        "note": "Da ban giao sach va nhan tien mat truc tiep tai truong"
    }, token=context["seller_token"])
    record_test("Journey E", "E6", "Dual Confirm Part 2 (Seller Confirms -> Status COMPLETED)", "PATCH",
                f"/api/v1/transactions/{context['tx_id']}/confirm", 200, res,
                lambda b: b.get("data", {}).get("status") == "COMPLETED")

    # E7: Verify Listing SOLD Sync via Inter-Service RestClient
    res = make_request("GET", f"{GATEWAY_BASE}/api/v1/listings/{context['listing_1_id']}", token=context["seller_token"])
    record_test("Journey E", "E7", "Verify Listing Automatic Transition to SOLD", "GET",
                f"/api/v1/listings/{context['listing_1_id']}", 200, res,
                lambda b: b.get("data", {}).get("status") == "SOLD" and b["data"]["soldAt"] is not None)

    # -------------------------------------------------------------------------
    # Journey F: Violation Report & Resolution
    # -------------------------------------------------------------------------
    print("\n--- JOURNEY F: Violation Report, Moderator Queue & Penalty ---")

    # Create a 2nd listing to report
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/listings", {
        "categoryId": 2,
        "title": f"Dien thoai cu gia re {suffix}",
        "description": "Dien thoai kem chat luong dang bi nghi ngo gian lan",
        "price": 200000.00,
        "itemCondition": "USED",
        "conditionPercent": 50,
        "submitForReview": True,
        "images": []
    }, token=context["seller_token"])
    context["listing_2_id"] = res["body"]["data"]["id"]

    # F1: Buyer Submits Violation Report
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/reports", {
        "targetType": "LISTING",
        "targetId": context["listing_2_id"],
        "reason": "FRAUD_SCAM",
        "details": "Tin dang co dau hieu lua dao tai khoan sinh vien",
        "evidenceImageUrl": "https://cdn.stu.edu.vn/reports/evidence_1.jpg"
    }, token=context["buyer_token"])
    record_test("Journey F", "F1", "Buyer Submits Violation Report Against Listing", "POST", "/api/v1/reports", 201, res,
                lambda b: b.get("data", {}).get("status") == "PENDING")
    context["report_id"] = res["body"]["data"]["id"]

    # F2: Moderator Views Report Queue
    res = make_request("GET", f"{GATEWAY_BASE}/api/v1/moderation/reports", token=context["mod_token"])
    record_test("Journey F", "F2", "Moderator Views Incident Report Queue", "GET",
                "/api/v1/moderation/reports", 200, res,
                lambda b: any(r["id"] == context["report_id"] for r in b.get("data", {}).get("content", [])))

    # F3: Moderator Assigns Report
    res = make_request("PATCH", f"{GATEWAY_BASE}/api/v1/moderation/reports/{context['report_id']}/assign", token=context["mod_token"])
    record_test("Journey F", "F3", "Moderator Assigns Report to Self", "PATCH",
                f"/api/v1/moderation/reports/{context['report_id']}/assign", 200, res,
                lambda b: b.get("data", {}).get("status") == "INVESTIGATING")

    # F4: Moderator Resolves Report with Penalty
    res = make_request("PATCH", f"{GATEWAY_BASE}/api/v1/moderation/reports/{context['report_id']}/resolve", {
        "resolutionAction": "WARNING_SENT",
        "resolutionNotes": "Da gui canh cao toi nguoi ban vi vi pham quy dinh dang tin STU"
    }, token=context["mod_token"])
    record_test("Journey F", "F4", "Moderator Resolves Report with Resolution Action", "PATCH",
                f"/api/v1/moderation/reports/{context['report_id']}/resolve", 200, res,
                lambda b: b.get("data", {}).get("status") == "RESOLVED" and b["data"]["resolutionAction"] == "WARNING_SENT")

    # F5: Moderator Checks Audit Logs
    res = make_request("GET", f"{GATEWAY_BASE}/api/v1/moderation/audit-logs", token=context["mod_token"])
    record_test("Journey F", "F5", "Moderation Audit Logs Capture Action", "GET",
                "/api/v1/moderation/audit-logs", 200, res,
                lambda b: len(b.get("data", {}).get("content", [])) > 0)

    # -------------------------------------------------------------------------
    # Journey G: Listing Fees & Sandbox Payment
    # -------------------------------------------------------------------------
    print("\n--- JOURNEY G: Platform Listing Fees, Sandbox Payment & Priority Boost ---")

    # G1: Get Fee Packages
    res = make_request("GET", f"{GATEWAY_BASE}/api/v1/billing/packages")
    record_test("Journey G", "G1", "Seller Queries Available Listing Fee Packages", "GET",
                "/api/v1/billing/packages", 200, res,
                lambda b: (isinstance(b.get("data"), list) and len(b.get("data")) > 0) or (isinstance(b.get("data"), dict) and len(b.get("data", {}).get("content", [])) > 0))
    packages = res["body"]["data"] if isinstance(res["body"]["data"], list) else res["body"]["data"].get("content", [])
    context["package_id"] = packages[0]["id"]

    # Create a 3rd listing and approve it to receive the boost
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/listings", {
        "categoryId": 1,
        "title": f"Tai lieu on thi Tot nghiep STU {suffix}",
        "description": "Bo de thi va bai giai on tap tot nghiep STU",
        "price": 30000.00,
        "itemCondition": "NEW",
        "conditionPercent": 100,
        "submitForReview": True,
        "images": []
    }, token=context["seller_token"])
    context["listing_3_id"] = res["body"]["data"]["id"]

    # Approve listing 3
    make_request("PATCH", f"{GATEWAY_BASE}/api/v1/listings/{context['listing_3_id']}/moderate", {
        "status": "PUBLISHED",
        "reason": "Approved for public viewing"
    }, token=context["mod_token"])

    # G2: Create Invoice for Boost Package
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/billing/invoices", {
        "listingId": context["listing_3_id"],
        "packageId": context["package_id"]
    }, token=context["seller_token"])
    record_test("Journey G", "G2", "Generate Platform Listing Fee Invoice", "POST", "/api/v1/billing/invoices", 201, res,
                lambda b: b.get("data", {}).get("status") == "PENDING")
    context["invoice_id"] = res["body"]["data"]["id"]

    # G3: Pay Invoice via Sandbox (VNPAY)
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/billing/invoices/{context['invoice_id']}/pay", {
        "gatewayProvider": "VNPAY"
    }, token=context["seller_token"])
    record_test("Journey G", "G3", "Process Listing Fee via Payment Sandbox (VNPAY)", "POST",
                f"/api/v1/billing/invoices/{context['invoice_id']}/pay", 200, res,
                lambda b: b.get("data", {}).get("status") == "SUCCESS")

    # G4: Verify Invoice Status PAID
    res = make_request("GET", f"{GATEWAY_BASE}/api/v1/billing/invoices/{context['invoice_id']}", token=context["seller_token"])
    record_test("Journey G", "G4", "Verify Invoice Final State is PAID", "GET",
                f"/api/v1/billing/invoices/{context['invoice_id']}", 200, res,
                lambda b: b.get("data", {}).get("status") == "PAID" and b["data"]["paidAt"] is not None)

    # G5: Verify Boost Activated in Listing Service via ListingBoostClient
    res = make_request("GET", f"{GATEWAY_BASE}/api/v1/listings/{context['listing_3_id']}", token=context["seller_token"])
    record_test("Journey G", "G5", "Verify Priority Boost Activated in Listing History", "GET",
                f"/api/v1/listings/{context['listing_3_id']}", 200, res,
                lambda b: any("boosted" in str(h.get("reason", "")).lower() for h in b.get("data", {}).get("statusHistory", [])))

    # -------------------------------------------------------------------------
    # Security & Architectural Invariants S1-S8
    # -------------------------------------------------------------------------
    print("\n--- SECURITY & ARCHITECTURAL INVARIANTS (S1 - S8) ---")

    # S1: Block P2P transfers
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/billing/transfers", {"amount": 50000}, token=context["seller_token"])
    record_test("Security", "S1", "Zero P2P: Block P2P Monetary Transfers (Code 6004)", "POST",
                "/api/v1/billing/transfers", 400, res,
                lambda b: b.get("code") == 6004 and "prohibited" in str(b.get("message", "")).lower())

    # S2: Block P2P escrow
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/billing/escrow", {"amount": 50000}, token=context["buyer_token"])
    record_test("Security", "S2", "Zero P2P: Block Escrow Wallet (Code 6004)", "POST",
                "/api/v1/billing/escrow", 400, res,
                lambda b: b.get("code") == 6004 and "prohibited" in str(b.get("message", "")).lower())

    # S3: Anti-Self Buy
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/transactions", {
        "listingId": context["listing_1_id"],
        "sellerId": context["seller_id"],
        "agreedPrice": 50000.00
    }, token=context["seller_token"])
    record_test("Security", "S3", "Anti-Self: Reject Transaction on Own Item (Code 4003)", "POST",
                "/api/v1/transactions", 400, res,
                lambda b: b.get("code") == 4003 or "own item" in str(b.get("message", "")).lower())

    # S4: Anti-Self Chat
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/conversations", {
        "listingId": context["listing_1_id"],
        "sellerId": context["seller_id"]
    }, token=context["seller_token"])
    record_test("Security", "S4", "Anti-Self: Reject Chat Conversation With Self (Code 3007)", "POST",
                "/api/v1/conversations", 400, res,
                lambda b: b.get("code") == 3007 or "with self" in str(b.get("message", "")).lower())

    # S5: Anti-Self Report
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/reports", {
        "targetType": "USER",
        "targetId": context["buyer_id"],
        "reason": "OTHER",
        "details": "Self reporting test"
    }, token=context["buyer_token"])
    record_test("Security", "S5", "Anti-Self: Reject Filing Violation Report Against Self (Code 5003)", "POST",
                "/api/v1/reports", 400, res,
                lambda b: b.get("code") == 5003 or "report self" in str(b.get("message", "")).lower())

    # S6: RBAC Unauthorized Access (Student attempts to read moderation report queue)
    res = make_request("GET", f"{GATEWAY_BASE}/api/v1/moderation/reports", token=context["buyer_token"])
    record_test("Security", "S6", "RBAC: Student Access to Moderator Queue Forbidden", "GET",
                "/api/v1/moderation/reports", 403, res)

    # S7: Invalid JWT Token
    res = make_request("GET", f"{GATEWAY_BASE}/api/v1/users/me", token="eyJhbGciOiJIUzUxMiJ9.invalid.signature")
    record_test("Security", "S7", "JWT: Malformed/Forged Token Rejected as Unauthorized", "GET",
                "/api/v1/users/me", 401, res)

    # S8: SEC-04 Locked/Suspended Account
    res = make_request("POST", f"{GATEWAY_BASE}/api/v1/auth/login", {
        "emailOrStudentCode": "suspended_test@stu.edu.vn",
        "password": "Password123!"
    })
    record_test("Security", "S8", "SEC-04: Suspended Account Blocked from Login", "POST",
                "/api/v1/auth/login", 500, res,
                lambda b: "locked" in str(b.get("message", "")).lower() or "suspended" in str(b.get("message", "")).lower())

    # -------------------------------------------------------------------------
    # Verification Summary & Report
    # -------------------------------------------------------------------------
    total_tests = len(test_records)
    passed_tests = sum(1 for r in test_records if r["passed"])
    failed_tests = total_tests - passed_tests

    print("\n" + "=" * 80)
    print(f"E2E VERIFICATION SUITE RESULTS: {passed_tests}/{total_tests} PASSED ({passed_tests/total_tests*100:.1f}%)")
    print(f"Failed Tests: {failed_tests}")
    print("=" * 80)

    return {
        "total": total_tests,
        "passed": passed_tests,
        "failed": failed_tests,
        "records": test_records,
        "services": health_results
    }

if __name__ == "__main__":
    results = run_e2e_suite()
    # Save results to json for reporting
    with open("logs/e2e_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    if results["failed"] > 0:
        sys.exit(1)
    sys.exit(0)
