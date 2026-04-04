#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory and project root
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

safe_clear

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                          ║${NC}"
echo -e "${CYAN}║              🐝  HIVE PLATFORM STARTUP  🐝               ║${NC}"
echo -e "${CYAN}║          Collaborative Study Platform Setup              ║${NC}"
echo -e "${CYAN}║                                                          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}✗ Error: Docker is not running${NC}"
  echo -e "${YELLOW}Please start Docker Desktop and try again${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"
echo ""

# Change to hive directory
cd "$HIVE_DIR" || {
  echo -e "${RED}✗ Error: Could not find hive directory${NC}"
  exit 1
}

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}⚠ Warning: .env file not found${NC}"
  echo -e "${YELLOW}Creating .env from .env.example...${NC}"
  if [ -f .env.example ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠ Please update .env with your actual credentials${NC}"
  else
    echo -e "${RED}✗ Error: .env.example not found${NC}"
    exit 1
  fi
  echo ""
fi

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                   Starting Services                      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Stop any existing containers
echo -e "${YELLOW}Stopping any existing containers...${NC}"
docker compose down --remove-orphans > /dev/null 2>&1
echo -e "${GREEN}✓ Cleaned up existing containers${NC}"
echo ""

# Start services
echo -e "${YELLOW}Starting all services with Docker Compose...${NC}"
echo -e "${BLUE}This may take a few minutes on first run...${NC}"
echo ""

start_compose() {
  docker compose up -d --build
}

start_compose
compose_status=$?

if [ "$compose_status" -ne 0 ]; then
  echo ""
  echo -e "${YELLOW}Initial start failed; retrying after a clean shutdown...${NC}"
  docker compose down --remove-orphans > /dev/null 2>&1
  sleep 3
  start_compose
  compose_status=$?
fi

if [ "$compose_status" -ne 0 ]; then
  echo ""
  echo -e "${RED}✗ Error: Failed to start services${NC}"
  echo -e "${YELLOW}Check the logs above for details${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✓ Docker Compose started successfully${NC}"
echo ""

# Wait for services to become healthy
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Waiting for Services to be Healthy          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}This usually takes 1-2 minutes...${NC}"
echo ""

# Run the wait-for-healthy script
"$SCRIPT_DIR/wait-for-healthy.sh"

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║                                                          ║${NC}"
  echo -e "${CYAN}║           🎉  HIVE PLATFORM IS READY!  🎉               ║${NC}"
  echo -e "${CYAN}║                                                          ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${BLUE}Quick Commands:${NC}"
  echo -e "  ${GREEN}$SCRIPT_DIR/check-health.sh${NC}     - Check service health status"
  echo -e "  ${GREEN}docker compose logs -f${NC} - View all logs (from hive/ directory)"
  echo -e "  ${GREEN}docker compose ps${NC}      - List all containers (from hive/ directory)"
  echo -e "  ${GREEN}docker compose down${NC}    - Stop all services (from hive/ directory)"
  echo ""
else
  echo ""
  echo -e "${RED}Some services failed to become healthy${NC}"
  echo -e "${YELLOW}Run '$SCRIPT_DIR/check-health.sh' to see which services need attention${NC}"
  exit 1
fi
