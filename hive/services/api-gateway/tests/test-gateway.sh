#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  🐝 HIVE API Gateway — Manual Test Suite
#  Run:  bash tests/test-gateway.sh <FIREBASE_ID_TOKEN>
set -euo pipefail

GW="http://localhost:4000"
TOKEN="${1:-}"          # Pass a Firebase ID token as first argument

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

pass() { echo -e "  ${GREEN}✔${NC}  $1"; }
fail() { echo -e "  ${RED}✘${NC}  $1"; }
info() { echo -e "  ${CYAN}→${NC}  $1"; }
section() { echo -e "\n${BOLD}${YELLOW}$1${NC}"; }

# ── Helper ────────────────────────────────────────────────────────────────────
# Returns HTTP status code
http_status() {
  curl -s -o /dev/null -w "%{http_code}" "$@"
}

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   🐝  HIVE API Gateway Test Suite                   ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"

# ─────────────────────────────────────────────────────────────────────────────
section "1. Public Routes (no token required)"
# ─────────────────────────────────────────────────────────────────────────────

info "GET /health"
STATUS=$(http_status "$GW/health")
if [ "$STATUS" = "200" ]; then
  pass "GET /health → $STATUS"
  curl -s "$GW/health" | python3 -m json.tool 2>/dev/null || true
else
  fail "GET /health → $STATUS (expected 200)"
fi

info "GET /"
STATUS=$(http_status "$GW/")
[ "$STATUS" = "200" ] && pass "GET / → $STATUS" || fail "GET / → $STATUS (expected 200)"

# ─────────────────────────────────────────────────────────────────────────────
section "2. Auth Middleware — Blocking Unauthorized Requests"
# ─────────────────────────────────────────────────────────────────────────────

info "Protected route with NO token  (expect 401)"
STATUS=$(http_status "$GW/users/api/users")
if [ "$STATUS" = "401" ]; then
  pass "GET /users/api/users (no token) → $STATUS ✓ blocked"
else
  fail "GET /users/api/users (no token) → $STATUS (expected 401)"
fi

info "Protected route with INVALID token  (expect 403)"
STATUS=$(http_status -H "Authorization: Bearer invalid.token.here" "$GW/users/api/users")
if [ "$STATUS" = "403" ]; then
  pass "GET /users/api/users (bad token) → $STATUS ✓ blocked"
else
  fail "GET /users/api/users (bad token) → $STATUS (expected 403)"
fi

# ─────────────────────────────────────────────────────────────────────────────
section "3. Auth Middleware — Valid Token"
# ─────────────────────────────────────────────────────────────────────────────
if [ -z "$TOKEN" ]; then
  echo -e "  ${YELLOW}⚠  No TOKEN supplied — skipping authenticated tests${NC}"
  echo -e "  ${YELLOW}   Run:  bash tests/test-gateway.sh \$(node scripts/getToken.js superadmin@hive.kln.ac.lk SuperAdmin@123 | grep -oP 'eyJ[^\\s]+')\${NC}"
else
  info "GET /users/api/users with valid token  (expect 200 or 403 from upstream)"
  STATUS=$(http_status -H "Authorization: Bearer $TOKEN" "$GW/users/api/users")
  if [ "$STATUS" = "200" ] || [ "$STATUS" = "403" ]; then
    pass "GET /users/api/users (valid token) → $STATUS ✓ reached upstream"
  else
    fail "GET /users/api/users (valid token) → $STATUS"
  fi

  info "GET /users/api/admins with valid token  (expect 200 or 403 from upstream)"
  STATUS=$(http_status -H "Authorization: Bearer $TOKEN" "$GW/users/api/admins")
  if [ "$STATUS" = "200" ] || [ "$STATUS" = "403" ]; then
    pass "GET /users/api/admins (valid token) → $STATUS ✓ reached upstream"
  else
    fail "GET /users/api/admins (valid token) → $STATUS"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
section "4. Routing — 404 for Unknown Routes"
# ─────────────────────────────────────────────────────────────────────────────
info "GET /unknown (expect 401 → auth blocks before 404)"
STATUS=$(http_status "$GW/unknown-route")
[ "$STATUS" = "401" ] && pass "GET /unknown-route → $STATUS ✓ blocked by auth" \
                        || fail "GET /unknown-route → $STATUS"

# ─────────────────────────────────────────────────────────────────────────────
section "5. Rate Limiting (100 req / 15 min)"
# ─────────────────────────────────────────────────────────────────────────────
info "Sending 105 rapid requests to /health — last ones should get 429..."
RATE_LIMITED=0
for i in $(seq 1 105); do
  CODE=$(http_status "$GW/health")
  if [ "$CODE" = "429" ]; then
    RATE_LIMITED=1
    pass "Request #$i received 429 Too Many Requests ✓"
    break
  fi
done
if [ "$RATE_LIMITED" = "0" ]; then
  echo -e "  ${YELLOW}⚠  Rate limit not triggered in 105 requests (may need a fresh IP window)${NC}"
fi

# ─────────────────────────────────────────────────────────────────────────────
section "6. Proxy Routing — Downstream Services"
# ─────────────────────────────────────────────────────────────────────────────
ROUTES=(
  "/auth|http://localhost:3000"
  "/users|http://localhost:3001"
  "/resources|http://localhost:3002"
  "/chat|http://localhost:3003"
  "/notes|http://localhost:3004"
  "/progress|http://localhost:3005"
  "/sessions|http://localhost:3006"
  "/rag|http://localhost:8000"
)

for entry in "${ROUTES[@]}"; do
  PREFIX="${entry%%|*}"
  TARGET="${entry##*|}"
  UPSTREAM_STATUS=$(http_status "$TARGET/health" 2>/dev/null || echo "---")
  info "Upstream $PREFIX → $TARGET/health : $UPSTREAM_STATUS"
done

echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Test complete. Check results above.${NC}"
echo ""
echo -e "  ${YELLOW}To run authenticated tests:${NC}"
echo -e "  ${CYAN}cd services/user-service${NC}"
echo -e "  ${CYAN}node scripts/getToken.js superadmin@hive.kln.ac.lk SuperAdmin@123${NC}"
echo -e "  ${CYAN}bash services/api-gateway/tests/test-gateway.sh <TOKEN>${NC}"
echo ""
