#!/usr/bin/env bash
# =============================================================================
#  HIVE Resource Service — API Test Suite
#  Usage:  ./tests/test-resource-service.sh [BASE_URL] [TOKEN]
#
#  BASE_URL defaults to http://localhost:3002
#  TOKEN    is a valid Firebase ID token (admin / superadmin role)
#
#  Requirements: curl, jq (optional — pretty-prints JSON)
# =============================================================================

BASE_URL="${1:-http://localhost:3002}"
TOKEN="${2:-}"
ADMIN_TOKEN="${TOKEN}"

# Colours
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

PASS=0; FAIL=0

check() {
  local label="$1" expected="$2" actual="$3"
  if [ "$actual" -eq "$expected" ] 2>/dev/null; then
    echo -e "  ${GREEN}✅ PASS${NC}  $label (HTTP $actual)"
    ((PASS++))
  else
    echo -e "  ${RED}❌ FAIL${NC}  $label — expected HTTP $expected, got HTTP $actual"
    ((FAIL++))
  fi
}

req() {
  # req METHOD URL [extra curl args...]
  local method="$1" url="$2"; shift 2
  curl -s -o /tmp/rs_body.json -w "%{http_code}" -X "$method" "$url" "$@"
}

body() { cat /tmp/rs_body.json 2>/dev/null; }

echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}   📚  HIVE Resource Service Test Suite${NC}"
echo -e "${CYAN}   Base URL: ${BASE_URL}${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════════${NC}"
echo ""

# ─────────────────────────────────────────────────────────────
echo -e "${YELLOW}[1] Health & Root Endpoints${NC}"
# ─────────────────────────────────────────────────────────────

STATUS=$(req GET "$BASE_URL/health")
check "GET /health" 200 "$STATUS"

STATUS=$(req GET "$BASE_URL/")
check "GET /" 200 "$STATUS"

# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[2] Auth Guard — No Token${NC}"
# ─────────────────────────────────────────────────────────────

STATUS=$(req GET "$BASE_URL/resources/subjects")
check "GET /resources/subjects — no token → 401" 401 "$STATUS"

STATUS=$(req POST "$BASE_URL/resources/subjects" -H "Content-Type: application/json" -d '{}')
check "POST /resources/subjects — no token → 401" 401 "$STATUS"

STATUS=$(req GET "$BASE_URL/resources/stats")
check "GET /resources/stats — no token → 401 (not param)" 401 "$STATUS"

# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[3] Auth Guard — Bad Token${NC}"
# ─────────────────────────────────────────────────────────────

STATUS=$(req GET "$BASE_URL/resources/subjects" -H "Authorization: Bearer this.is.invalid")
check "GET /resources/subjects — bad token → 403" 403 "$STATUS"

STATUS=$(req GET "$BASE_URL/resources/stats" -H "Authorization: Bearer this.is.invalid")
check "GET /resources/stats — bad token → 403" 403 "$STATUS"

# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[4] 404 Handler${NC}"
# ─────────────────────────────────────────────────────────────

STATUS=$(req GET "$BASE_URL/nonexistent-path")
check "GET /nonexistent-path → 404" 404 "$STATUS"

STATUS=$(req GET "$BASE_URL/resources/nonexistent/path/deep")
check "GET /resources/deep-nonexistent → 404" 404 "$STATUS"

# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[5] Authenticated Flows (requires valid TOKEN)${NC}"
# ─────────────────────────────────────────────────────────────

if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "  ${YELLOW}⚠  Skipped — no TOKEN provided. Pass a Firebase ID token as second argument.${NC}"
  echo -e "     Example: ./tests/test-resource-service.sh http://localhost:3002 eyJhbGci..."
else
  AUTH="-H \"Authorization: Bearer $ADMIN_TOKEN\""

  # Create a subject
  STATUS=$(req POST "$BASE_URL/resources/subjects" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"subjectCode":"SE3050","subjectName":"Software Architecture","level":3,"semester":1,"description":"Test subject"}')
  check "POST /resources/subjects → 201" 201 "$STATUS"
  echo "       Response: $(body)"

  # Get all subjects
  STATUS=$(req GET "$BASE_URL/resources/subjects" -H "Authorization: Bearer $ADMIN_TOKEN")
  check "GET /resources/subjects → 200" 200 "$STATUS"

  # Get single subject
  STATUS=$(req GET "$BASE_URL/resources/subjects/SE3050" -H "Authorization: Bearer $ADMIN_TOKEN")
  check "GET /resources/subjects/SE3050 → 200" 200 "$STATUS"

  # Update subject
  STATUS=$(req PUT "$BASE_URL/resources/subjects/SE3050" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"description":"Updated description"}')
  check "PUT /resources/subjects/SE3050 → 200" 200 "$STATUS"

  # Stats
  STATUS=$(req GET "$BASE_URL/resources/stats" -H "Authorization: Bearer $ADMIN_TOKEN")
  check "GET /resources/stats → 200" 200 "$STATUS"
  echo "       Stats: $(body | python3 -m json.tool 2>/dev/null || body)"

  # Upload — requires a real PDF file
  if [ -f "/tmp/test.pdf" ]; then
    STATUS=$(req POST "$BASE_URL/resources/upload" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -F "file=@/tmp/test.pdf" \
      -F "subjectCode=SE3050" \
      -F "resourceType=note" \
      -F "title=Test Note")
    check "POST /resources/upload (PDF) → 201" 201 "$STATUS"
    RESOURCE_ID=$(body | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['resource']['resourceId'])" 2>/dev/null)
    echo "       ResourceId: $RESOURCE_ID"

    if [ -n "$RESOURCE_ID" ]; then
      STATUS=$(req GET "$BASE_URL/resources/$RESOURCE_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
      check "GET /resources/:resourceId → 200" 200 "$STATUS"

      STATUS=$(req GET "$BASE_URL/resources/$RESOURCE_ID/download" -H "Authorization: Bearer $ADMIN_TOKEN")
      check "GET /resources/:resourceId/download → 200" 200 "$STATUS"

      STATUS=$(req DELETE "$BASE_URL/resources/$RESOURCE_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
      check "DELETE /resources/:resourceId → 200" 200 "$STATUS"
    fi
  else
    echo -e "  ${YELLOW}⚠  Upload test skipped — create a test PDF: echo '%PDF-1.4' > /tmp/test.pdf${NC}"
  fi

  # Wrong file type (should return 400)
  echo "dummy text" > /tmp/test.txt
  STATUS=$(req POST "$BASE_URL/resources/upload" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -F "file=@/tmp/test.txt" \
    -F "subjectCode=SE3050" \
    -F "resourceType=note" \
    -F "title=Should Fail")
  check "POST /resources/upload (TXT, non-PDF) → 400" 400 "$STATUS"
  rm -f /tmp/test.txt

  # Student role cannot create subject (need student token — skip if not provided)
  echo -e "  ${YELLOW}ℹ  Role guard test (student→subject create) requires a student-role token.${NC}"
fi

# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════════${NC}"
echo -e "  Results:  ${GREEN}$PASS passed${NC}  |  ${RED}$FAIL failed${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════════${NC}"
echo ""

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
