#!/bin/bash

# Live health monitoring dashboard
# Shows real-time status of all services

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Get script directory and change to hive directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HIVE_DIR="$PROJECT_ROOT/hive"

# Change to hive directory for docker compose commands
cd "$HIVE_DIR" || {
  echo -e "${RED}✗ Error: Could not find hive directory${NC}"
  exit 1
}

# Function to check a service
check_service() {
  local url=$1
  response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 "$url" 2>/dev/null)
  echo "$response"
}

# Function to get docker health
get_docker_health() {
  local service=$1
  # Handle both array and object formats from docker compose
  local health=$(docker compose ps --format json "$service" 2>/dev/null | jq -r 'if type == "array" then .[0].Health // "unknown" else .Health // "unknown" end')
  echo "$health"
}

# Clear screen and hide cursor
clear
tput civis

# Trap to show cursor on exit
trap 'tput cnorm; exit' INT TERM EXIT

echo -e "${CYAN}             HIVE PLATFORM - LIVE STATUS MONITOR             ${NC}"
echo -e "${CYAN}                  Press Ctrl+C to exit                          ${NC}"

while true; do
  # Move cursor to top
  tput cup 4 0
  
  echo -e "$(date '+%Y-%m-%d %H:%M:%S')                                          "
  echo ""
  
  # # Database
  # echo -e "${YELLOW}DATABASE:${NC}"
  # mongo_health=$(get_docker_health "mongo")
  # if [ "$mongo_health" = "healthy" ]; then
  #   echo -e "  ${GREEN}●${NC} MongoDB          ${GREEN}healthy${NC}      Port: 27017"
  # else
  #   echo -e "  ${RED}●${NC} MongoDB          ${RED}$mongo_health${NC}      Port: 27017"
  # fi
  # echo ""
  
  # Microservices
  echo -e "${YELLOW}MICROSERVICES:${NC}"
  
  services=(
    # "api-gateway:4000"
    "auth-service:3000"
    "user-service:3001"
    "resource-service:3002"
    "chat-service:3003"
    "note-service:3004"
    "progress-service:3005"
    "session-service:3006"
    "rag-service:8000"
  )
  
  for service_info in "${services[@]}"; do
    IFS=':' read -r service port <<< "$service_info"
    display_name=$(echo "$service" | sed 's/-service//' | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++)sub(/./,toupper(substr($i,1,1)),$i)}1')
    
    http_code=$(check_service "http://localhost:$port/health")
    docker_health=$(get_docker_health "$service")
    
    # Format service name with padding
    printf "  "
    if [ "$http_code" = "200" ] && [ "$docker_health" = "healthy" ]; then
      printf "${GREEN}●${NC} %-18s ${GREEN}%-12s${NC}" "$display_name" "healthy"
    elif [ "$docker_health" = "starting" ]; then
      printf "${YELLOW}●${NC} %-18s ${YELLOW}%-12s${NC}" "$display_name" "starting..."
    else
      printf "${RED}●${NC} %-18s ${RED}%-12s${NC}" "$display_name" "unhealthy"
    fi
    echo " Port: $port"
  done
  
  echo ""
  
  # Frontend
  echo -e "${YELLOW}FRONTEND:${NC}"
  frontend_code=$(check_service "http://localhost:80")
  frontend_health=$(get_docker_health "frontend")
  
  if [ "$frontend_code" = "200" ] || [ "$frontend_health" = "healthy" ]; then
    echo -e "  ${GREEN}●${NC} React App        ${GREEN}healthy${NC}      Port: 5173"
  elif [ "$frontend_health" = "starting" ]; then
    echo -e "  ${YELLOW}●${NC} React App        ${YELLOW}starting...${NC}  Port: 5173"
  else
    echo -e "  ${RED}●${NC} React App        ${RED}down${NC}         Port: 5173"
  fi
  
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  # Count healthy services
  total_services=12
  healthy_count=0
  
  for service_info in "${services[@]}"; do
    IFS=':' read -r service port <<< "$service_info"
    http_code=$(check_service "http://localhost:$port/health")
    if [ "$http_code" = "200" ]; then
      ((healthy_count++))
    fi
  done
  
  # Check mongo
  if [ "$mongo_health" = "healthy" ]; then
    ((healthy_count++))
  fi

  if [ "$pgvector_health" = "healthy" ]; then
    ((healthy_count++))
  fi
  
  # Check frontend
  if [ "$frontend_code" = "200" ] || [ "$frontend_health" = "healthy" ]; then
    ((healthy_count++))
  fi
  
  echo ""
  if [ $healthy_count -eq $total_services ]; then
    echo -e "   ${GREEN}✓ ALL SERVICES HEALTHY${NC} ($healthy_count/$total_services)    ${GREEN}✓ SYSTEM READY${NC}"
    echo -e "   ${BLUE}→ Access application: ${GREEN}http://localhost:80${NC}"
  else
    echo -e "   ${YELLOW}⚠ SERVICES STARTING${NC} ($healthy_count/$total_services healthy)    ${YELLOW}⟳ Please wait...${NC}"
  fi
  
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  
  # Wait before next check
  sleep 2
done
