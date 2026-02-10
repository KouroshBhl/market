#!/usr/bin/env bash
#
# Test: Seller Tenant Isolation
# ==============================
# Verifies that seller A cannot access seller B's offers.
#
# Prerequisites:
#   1. API server running on localhost:4000
#   2. Two seller accounts exist with valid JWT tokens
#
# Usage:
#   SELLER_A_TOKEN="..." SELLER_A_ID="..." \
#   SELLER_B_TOKEN="..." SELLER_B_ID="..." \
#   bash scripts/test-tenant-isolation.sh
#
# If tokens are not set, the script will attempt to create test accounts.
#
# Expected results:
#   - Seller A can list their own offers (200)
#   - Seller B cannot list seller A's offers (403)
#   - Unauthenticated requests are rejected (401)
#   - Crafted requests with wrong sellerId are rejected (403)

set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"
PASSED=0
FAILED=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_pass() {
  echo -e "${GREEN}[PASS]${NC} $1"
  PASSED=$((PASSED + 1))
}

log_fail() {
  echo -e "${RED}[FAIL]${NC} $1"
  FAILED=$((FAILED + 1))
}

log_info() {
  echo -e "${YELLOW}[INFO]${NC} $1"
}

# ============================================
# Helper: Make API request and return HTTP status
# ============================================
api_status() {
  local method="$1"
  local path="$2"
  local token="${3:-}"
  local body="${4:-}"

  local args=(-s -o /dev/null -w "%{http_code}" -X "$method" "${API_URL}${path}")

  if [ -n "$token" ]; then
    args+=(-H "Authorization: Bearer $token")
  fi

  if [ -n "$body" ]; then
    args+=(-H "Content-Type: application/json" -d "$body")
  fi

  curl "${args[@]}" 2>/dev/null
}

# ============================================
# Setup: Get or create test seller accounts
# ============================================
setup_sellers() {
  if [ -n "${SELLER_A_TOKEN:-}" ] && [ -n "${SELLER_A_ID:-}" ] && \
     [ -n "${SELLER_B_TOKEN:-}" ] && [ -n "${SELLER_B_ID:-}" ]; then
    log_info "Using provided seller credentials"
    return 0
  fi

  log_info "Creating test seller accounts..."

  # Create seller A
  local res_a
  res_a=$(curl -s -X POST "${API_URL}/auth/signup" \
    -H "Content-Type: application/json" \
    -d '{"email":"test-seller-a-'$RANDOM'@test.local","password":"TestPass123!"}' 2>/dev/null)

  SELLER_A_TOKEN=$(echo "$res_a" | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))" 2>/dev/null || echo "")

  if [ -z "$SELLER_A_TOKEN" ]; then
    echo "Failed to create seller A. Response: $res_a"
    echo ""
    echo "Please provide tokens manually:"
    echo "  SELLER_A_TOKEN=... SELLER_A_ID=... SELLER_B_TOKEN=... SELLER_B_ID=... bash $0"
    exit 1
  fi

  # Get seller A's info
  local me_a
  me_a=$(curl -s "${API_URL}/auth/me" -H "Authorization: Bearer $SELLER_A_TOKEN" 2>/dev/null)
  SELLER_A_ID=$(echo "$me_a" | python3 -c "import sys,json; print(json.load(sys.stdin).get('sellerId',''))" 2>/dev/null || echo "")

  # Create seller B
  local res_b
  res_b=$(curl -s -X POST "${API_URL}/auth/signup" \
    -H "Content-Type: application/json" \
    -d '{"email":"test-seller-b-'$RANDOM'@test.local","password":"TestPass123!"}' 2>/dev/null)

  SELLER_B_TOKEN=$(echo "$res_b" | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))" 2>/dev/null || echo "")

  if [ -z "$SELLER_B_TOKEN" ]; then
    echo "Failed to create seller B. Response: $res_b"
    exit 1
  fi

  local me_b
  me_b=$(curl -s "${API_URL}/auth/me" -H "Authorization: Bearer $SELLER_B_TOKEN" 2>/dev/null)
  SELLER_B_ID=$(echo "$me_b" | python3 -c "import sys,json; print(json.load(sys.stdin).get('sellerId',''))" 2>/dev/null || echo "")

  log_info "Seller A: $SELLER_A_ID"
  log_info "Seller B: $SELLER_B_ID"
}

# ============================================
# Tests
# ============================================

echo ""
echo "========================================"
echo "  Seller Tenant Isolation Test Suite"
echo "========================================"
echo ""

setup_sellers

echo ""
echo "--- Test: Offers Endpoint Isolation ---"
echo ""

# Test 1: Seller A can list their own offers
status=$(api_status GET "/seller/${SELLER_A_ID}/offers" "$SELLER_A_TOKEN")
if [ "$status" = "200" ]; then
  log_pass "Seller A can list own offers (HTTP $status)"
else
  log_fail "Seller A cannot list own offers (HTTP $status, expected 200)"
fi

# Test 2: Seller B cannot list seller A's offers
status=$(api_status GET "/seller/${SELLER_A_ID}/offers" "$SELLER_B_TOKEN")
if [ "$status" = "403" ]; then
  log_pass "Seller B cannot list seller A's offers (HTTP $status)"
else
  log_fail "Seller B CAN list seller A's offers (HTTP $status, expected 403)"
fi

# Test 3: Unauthenticated request is rejected
status=$(api_status GET "/seller/${SELLER_A_ID}/offers" "")
if [ "$status" = "401" ]; then
  log_pass "Unauthenticated request rejected (HTTP $status)"
else
  log_fail "Unauthenticated request NOT rejected (HTTP $status, expected 401)"
fi

# Test 4: Old route pattern (query param) no longer works
status=$(api_status GET "/seller/offers?sellerId=${SELLER_A_ID}" "$SELLER_A_TOKEN")
if [ "$status" = "404" ] || [ "$status" = "401" ]; then
  log_pass "Old query param route no longer works (HTTP $status)"
else
  log_fail "Old query param route STILL works (HTTP $status, expected 404)"
fi

echo ""
echo "--- Test: Orders Endpoint Isolation ---"
echo ""

# Test 5: Seller A can list their own orders
status=$(api_status GET "/seller/${SELLER_A_ID}/orders" "$SELLER_A_TOKEN")
if [ "$status" = "200" ]; then
  log_pass "Seller A can list own orders (HTTP $status)"
else
  log_fail "Seller A cannot list own orders (HTTP $status, expected 200)"
fi

# Test 6: Seller B cannot list seller A's orders
status=$(api_status GET "/seller/${SELLER_A_ID}/orders" "$SELLER_B_TOKEN")
if [ "$status" = "403" ]; then
  log_pass "Seller B cannot list seller A's orders (HTTP $status)"
else
  log_fail "Seller B CAN list seller A's orders (HTTP $status, expected 403)"
fi

# Test 7: Old orders route pattern no longer works
status=$(api_status GET "/orders/seller?sellerId=${SELLER_A_ID}" "$SELLER_A_TOKEN")
if [ "$status" = "404" ] || [ "$status" = "401" ]; then
  log_pass "Old seller orders route no longer works (HTTP $status)"
else
  log_fail "Old seller orders route STILL works (HTTP $status, expected 404)"
fi

echo ""
echo "--- Test: Key Pools Endpoint Isolation ---"
echo ""

# Test 8: Seller B cannot access seller A's key pools
status=$(api_status GET "/seller/${SELLER_A_ID}/key-pools/by-offer/00000000-0000-0000-0000-000000000000" "$SELLER_B_TOKEN")
if [ "$status" = "403" ]; then
  log_pass "Seller B cannot access seller A's key pools (HTTP $status)"
else
  log_fail "Seller B CAN access seller A's key pools (HTTP $status, expected 403)"
fi

echo ""
echo "--- Test: Offer Mutation Isolation ---"
echo ""

# Test 9: Seller B cannot create offers under seller A
status=$(api_status POST "/seller/${SELLER_A_ID}/offers/draft" "$SELLER_B_TOKEN" '{"deliveryType":"MANUAL"}')
if [ "$status" = "403" ]; then
  log_pass "Seller B cannot create offers under seller A (HTTP $status)"
else
  log_fail "Seller B CAN create offers under seller A (HTTP $status, expected 403)"
fi

# Test 10: Seller B cannot publish offers under seller A
status=$(api_status POST "/seller/${SELLER_A_ID}/offers/publish" "$SELLER_B_TOKEN" '{"deliveryType":"MANUAL","variantId":"x","priceAmount":100,"currency":"USD"}')
if [ "$status" = "403" ]; then
  log_pass "Seller B cannot publish offers under seller A (HTTP $status)"
else
  log_fail "Seller B CAN publish offers under seller A (HTTP $status, expected 403)"
fi

echo ""
echo "========================================"
echo "  Results: $PASSED passed, $FAILED failed"
echo "========================================"
echo ""

if [ "$FAILED" -gt 0 ]; then
  echo -e "${RED}TENANT ISOLATION TESTS FAILED${NC}"
  exit 1
else
  echo -e "${GREEN}ALL TENANT ISOLATION TESTS PASSED${NC}"
  exit 0
fi
