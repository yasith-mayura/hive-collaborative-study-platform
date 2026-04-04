#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory and change to hive directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HIVE_DIR="$PROJECT_ROOT/hive"

# Change to hive directory for docker compose commands
cd "$HIVE_DIR" || {
  echo -e "${RED}✗ Error: Could not find hive directory${NC}"
  exit 1
}

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Hive Platform - Service Health Check          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

ALL_HEALTHY=true

# Function to check a service
check_service() {
  local name=$1
  local url=$2
  
  response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 "$url" 2>/dev/null)
  
  if [ "$response" = "200" ]; then
    echo -e "  ${GREEN}✓${NC} $name - ${GREEN}healthy${NC}"
  else
    echo -e "  ${RED}✗${NC} $name - ${RED}unreachable${NC} (HTTP $response)"
    ALL_HEALTHY=false
  fi
}

echo -e "${YELLOW}Checking all services...${NC}"
echo ""

# Check databases
echo -e "${BLUE}Database:${NC}"
if docker compose ps mongo --format json 2>/dev/null | jq -e 'if type == "array" then .[0].State == "running" else .State == "running" end' > /dev/null 2>&1; then
  echo -e "  ${GREEN}✓${NC} MongoDB - ${GREEN}running${NC}"
else
  echo -e "  ${RED}✗${NC} MongoDB - ${RED}not running${NC}"
  ALL_HEALTHY=false
fi

if docker compose ps pgvector --format json 2>/dev/null | jq -e 'if type == "array" then .[0].State == "running" else .State == "running" end' > /dev/null 2>&1; then
  echo -e "  ${GREEN}✓${NC} PGVector - ${GREEN}running${NC}"
else
  echo -e "  ${RED}✗${NC} PGVector - ${RED}not running${NC}"
  ALL_HEALTHY=false
fi
echo ""

# Check each service
echo -e "${BLUE}Microservices:${NC}"
check_service "API Gateway" "http://localhost:4000/health"
check_service "Auth Service" "http://localhost:3000/health"
check_service "User Service" "http://localhost:3001/health"
check_service "Resource Service" "http://localhost:3002/health"
check_service "Chat Service" "http://localhost:3003/health"
check_service "Note Service" "http://localhost:3004/health"
check_service "Progress Service" "http://localhost:3005/health"
check_service "Session Service" "http://localhost:3006/health"
check_service "RAG Service" "http://localhost:8000/health"
echo ""

echo -e "${BLUE}Frontend:${NC}"
check_service "Frontend" "http://localhost:5173"
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
if [ "$ALL_HEALTHY" = true ]; then
  echo -e "${GREEN}║           ✓  All Services are Healthy!  ✓             ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${GREEN}✓ System is ready to use!${NC}"
  echo ""
  echo -e "${BLUE}Access your application at: ${GREEN}http://localhost:5173${NC}"
else
  echo -e "${RED}║            ⚠ Some Services are Down ⚠                 ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${YELLOW}⚠ Some services are not responding${NC}"
  echo ""
  echo -e "${YELLOW}Troubleshooting:${NC}"
  echo -e "  1. Check if services are starting: ${BLUE}docker compose ps${NC}"
  echo -e "  2. View logs: ${BLUE}docker compose logs <service-name>${NC}"
  echo -e "  3. Restart services: ${BLUE}docker compose restart${NC}"
  echo ""
fi

echo ""
