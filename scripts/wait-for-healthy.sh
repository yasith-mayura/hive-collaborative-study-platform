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

safe_clear() {
  if [ -n "${TERM:-}" ] && command -v clear >/dev/null 2>&1; then
    clear
  else
    printf '\n'
  fi
}

tput_supported() {
  [ -n "${TERM:-}" ] && command -v tput >/dev/null 2>&1
}

# Change to hive directory for docker compose commands
cd "$HIVE_DIR" || {
  echo -e "${RED}✗ Error: Could not find hive directory${NC}"
  exit 1
}

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Hive Platform - Waiting for Services to be Ready   ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo ""

# List of services to check
SERVICES=(
  "mongo"
  "pgvector"
  "api-gateway"
  "auth-service"
  "user-service"
  "resource-service"
  "chat-service"
  "note-service"
  "progress-service"
  "session-service"
  "rag-service"
  "frontend"
)

# Maximum wait time (5 minutes)
MAX_WAIT=300
START_TIME=$(date +%s)

# Function to check if a service is healthy
check_service_health() {
  local service=$1
  # Handle both array and object formats from docker compose
  local status=$(docker compose ps --format json "$service" 2>/dev/null | jq -r 'if type == "array" then .[0].Health // "unknown" else .Health // "unknown" end')
  echo "$status"
}

# Function to get service state
get_service_state() {
  local service=$1
  # Handle both array and object formats from docker compose
  local state=$(docker compose ps --format json "$service" 2>/dev/null | jq -r 'if type == "array" then .[0].State // "unknown" else .State // "unknown" end')
  echo "$state"
}

# Function to print status
print_status() {
  local service=$1
  local health=$2
  local state=$3
  
  if [ "$health" = "healthy" ]; then
    echo -e "  ${GREEN}✓${NC} $service - ${GREEN}healthy${NC}"
  elif [ "$state" = "running" ] && [ "$health" = "starting" ]; then
    echo -e "  ${YELLOW}⟳${NC} $service - ${YELLOW}starting...${NC}"
  elif [ "$state" = "running" ]; then
    echo -e "  ${YELLOW}⟳${NC} $service - ${YELLOW}running (checking health)${NC}"
  else
    echo -e "  ${RED}✗${NC} $service - ${RED}$state${NC}"
  fi
}

echo -e "${YELLOW}Starting health checks...${NC}"
echo ""

# Main loop
while true; do
  CURRENT_TIME=$(date +%s)
  ELAPSED=$((CURRENT_TIME - START_TIME))
  
  if [ $ELAPSED -gt $MAX_WAIT ]; then
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  Timeout: Services did not become healthy in time     ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Run 'docker compose logs <service-name>' to check errors${NC}"
    exit 1
  fi
  
  # Clear previous output when terminal capabilities are available
  if tput_supported; then
    tput cuu $(( ${#SERVICES[@]} + 3 )) 2>/dev/null || true
    tput ed 2>/dev/null || true
  fi
  
  echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} Checking service health (${ELAPSED}s elapsed)..."
  echo ""
  
  ALL_HEALTHY=true
  
  for service in "${SERVICES[@]}"; do
    health=$(check_service_health "$service")
    state=$(get_service_state "$service")
    
    print_status "$service" "$health" "$state"
    
    if [ "$health" != "healthy" ] && [ "$service" != "mongo" ] && [ "$service" != "pgvector" ]; then
      # For databases, check if it has no healthcheck or is healthy
      ALL_HEALTHY=false
    elif [ "$service" = "mongo" ] && [ "$health" != "healthy" ] && [ "$state" = "running" ]; then
      ALL_HEALTHY=false
    elif [ "$service" = "pgvector" ] && [ "$health" != "healthy" ] && [ "$state" = "running" ]; then
      ALL_HEALTHY=false
    fi
  done
  
  echo ""
  
  if [ "$ALL_HEALTHY" = true ]; then
    break
  fi
  
  sleep 3
done

# Clear and show success message
safe_clear

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✓  All Services are Healthy!  ✓             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Service Status:${NC}"
for service in "${SERVICES[@]}"; do
  echo -e "  ${GREEN}✓${NC} $service - healthy"
done
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Access Your Services:                     ║${NC}"
echo -e "${BLUE}╠════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║${NC}  Frontend:        ${GREEN}http://localhost:5173${NC}"
echo -e "${BLUE}║${NC}  API Gateway:     ${GREEN}http://localhost:4000${NC}"
echo -e "${BLUE}║${NC}  Auth Service:    ${GREEN}http://localhost:3000${NC}"
echo -e "${BLUE}║${NC}  User Service:    ${GREEN}http://localhost:3001${NC}"
echo -e "${BLUE}║${NC}  Resource Service:${GREEN}http://localhost:3002${NC}"
echo -e "${BLUE}║${NC}  Chat Service:    ${GREEN}http://localhost:3003${NC}"
echo -e "${BLUE}║${NC}  Note Service:    ${GREEN}http://localhost:3004${NC}"
echo -e "${BLUE}║${NC}  Progress Service:${GREEN}http://localhost:3005${NC}"
echo -e "${BLUE}║${NC}  Session Service: ${GREEN}http://localhost:3006${NC}"
echo -e "${BLUE}║${NC}  RAG Service:     ${GREEN}http://localhost:8000${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}💡 Tip: Run './check-health.sh' anytime to check service status${NC}"
echo ""
