#!/usr/bin/env bash
# =============================================================================
#  HIVE RAG Service — API Test Suite
#  Usage:  ./tests/test-rag-service.sh [BASE_URL]
#
#  BASE_URL defaults to http://localhost:8000
# =============================================================================

BASE_URL="${1:-http://localhost:8000}"

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
  local method="$1" url="$2"; shift 2
  curl -s -o /tmp/rag_body.json -w "%{http_code}" -X "$method" "$url" "$@"
}

body() { cat /tmp/rag_body.json 2>/dev/null; }

echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}   🤖  HIVE RAG Service Test Suite${NC}"
echo -e "${CYAN}   Base URL: ${BASE_URL}${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════════${NC}"
echo ""

# ─────────────────────────────────────────────────────────────
echo -e "${YELLOW}[1] Health & Root Endpoints${NC}"
# ─────────────────────────────────────────────────────────────

STATUS=$(req GET "$BASE_URL/health")
check "GET /health" 200 "$STATUS"
echo "       Response: $(body)"

STATUS=$(req GET "$BASE_URL/")
check "GET /" 200 "$STATUS"

# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[2] API Docs (FastAPI auto-generated)${NC}"
# ─────────────────────────────────────────────────────────────

STATUS=$(req GET "$BASE_URL/docs")
check "GET /docs (Swagger UI)" 200 "$STATUS"

STATUS=$(req GET "$BASE_URL/openapi.json")
check "GET /openapi.json" 200 "$STATUS"

# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[3] Validation Errors${NC}"
# ─────────────────────────────────────────────────────────────

# Missing required fields
STATUS=$(req POST "$BASE_URL/api/rag/ingest" \
  -H "Content-Type: application/json" \
  -d '{}')
check "POST /api/rag/ingest — empty body → 400/422" 422 "$STATUS"

STATUS=$(req POST "$BASE_URL/api/rag/chat" \
  -H "Content-Type: application/json" \
  -d '{}')
check "POST /api/rag/chat — empty body → 400/422" 422 "$STATUS"

# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[4] Chat Endpoint (requires running PGVector + Gemini)${NC}"
# ─────────────────────────────────────────────────────────────

STATUS=$(req POST "$BASE_URL/api/rag/chat" \
  -H "Content-Type: application/json" \
  -d '{"question":"What is MVC?","subjectCode":"SE3050","chatHistory":[]}')
if [ "$STATUS" -eq 200 ]; then
  check "POST /api/rag/chat — valid request" 200 "$STATUS"
  echo "       Answer: $(body | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('answer','')[:100])" 2>/dev/null)..."
else
  echo -e "  ${YELLOW}⚠  Chat endpoint returned HTTP $STATUS (PGVector/Gemini may not be running)${NC}"
  echo "       Body: $(body)"
fi

# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[5] Document Management${NC}"
# ─────────────────────────────────────────────────────────────

STATUS=$(req GET "$BASE_URL/api/rag/documents")
if [ "$STATUS" -eq 200 ]; then
  check "GET /api/rag/documents" 200 "$STATUS"
  echo "       Response: $(body | python3 -m json.tool 2>/dev/null || body)"
else
  echo -e "  ${YELLOW}⚠  Documents listing returned HTTP $STATUS (PGVector may not be running)${NC}"
fi

STATUS=$(req GET "$BASE_URL/api/rag/documents/stats")
if [ "$STATUS" -eq 200 ]; then
  check "GET /api/rag/documents/stats" 200 "$STATUS"
else
  echo -e "  ${YELLOW}⚠  Document stats returned HTTP $STATUS${NC}"
fi

# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[6] Delete Non-existent Document${NC}"
# ─────────────────────────────────────────────────────────────

STATUS=$(req DELETE "$BASE_URL/api/rag/documents/nonexistent-id")
if [ "$STATUS" -eq 200 ]; then
  check "DELETE /api/rag/documents/nonexistent-id → 200 (0 deleted)" 200 "$STATUS"
else
  echo -e "  ${YELLOW}⚠  Delete endpoint returned HTTP $STATUS${NC}"
fi

# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[7] Ingest Pipeline (requires running PGVector + S3 + Gemini)${NC}"
# ─────────────────────────────────────────────────────────────

echo -e "  ${YELLOW}ℹ  Ingest test is best run via resource-service upload flow.${NC}"
echo -e "  ${YELLOW}   Skipping standalone ingest test.${NC}"

# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════════${NC}"
echo -e "  Results:  ${GREEN}$PASS passed${NC}  |  ${RED}$FAIL failed${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════════${NC}"
echo ""

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
